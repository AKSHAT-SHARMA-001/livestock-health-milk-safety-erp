"""End-to-end HTTP smoke test. Run against running services; creates its own demo data.
Python standard library only. Uses historical treatment to demonstrate expiry without changing a clock.
"""
import json, os, urllib.request, urllib.error, uuid
from datetime import date, timedelta
BASE = {s: os.getenv(s.upper()+"_URL", "http://localhost:"+str(p)) for s,p in [("user",8081),("vet",8082),("pharmacy",8083),("milk",8084)]}
def call(s,path,body=None,method=None,expected=200,token=None):
    headers={"Content-Type":"application/json"}
    if token is None: headers["X-Service-Key"]=os.getenv("SERVICE_KEY","academic-local-service-key")
    elif token: headers["Authorization"]="Bearer "+token
    req=urllib.request.Request(BASE[s]+"/api"+path,data=None if body is None else json.dumps(body).encode(),headers=headers,method=method or ("POST" if body is not None else "GET"))
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            status=r.status
            data=json.loads(r.read() or "null")
    except urllib.error.HTTPError as e:
        status=e.code
        data=json.loads(e.read())
    assert status==expected,(s,path,status,data)
    return data
today=date.today()
tag=uuid.uuid4().hex[:8]
farmer=call("user","/auth/register/farmer",dict(name="Smoke Farmer",email=tag+"@test.local",password="Smoke123!",phone="1234567890",village="Demo",address="Campus"),expected=201)
fid=farmer["farmerId"]
call("user","/users",expected=401,token="")
call("user","/users",expected=403,token=farmer["token"])
call("user","/farmers/"+str(fid)+"/animals",token=farmer["token"])
call("user","/farmers/999999/animals",expected=403,token=farmer["token"])
call("user","/users",expected=401,token=farmer["token"]+"x")
print("PASS: bearer login, missing/tampered tokens, role and ownership enforcement.")
vetuser=call("user","/auth/login",dict(email="vet@demo.local",password="Demo123!"))
profiles=call("vet","/vets")
profile=next((v for v in profiles if v["userId"]==vetuser["userId"]),None) or call("vet","/vets",dict(userId=vetuser["userId"],name="Demo Vet",specialization="Dairy",phone="1234567890"))
listing=call("vet","/services",dict(vetId=profile["id"],title="Smoke Checkup",price=500,available=True))
medicine=call("pharmacy","/medicines",dict(name="Test antibiotic "+tag,type="MEDICINE",antibiotic=True,withdrawalDays=3,stock=20,threshold=19,expiryDate=str(today+timedelta(days=365))))
vaccine=call("pharmacy","/medicines",dict(name="Test vaccine "+tag,type="VACCINE",antibiotic=False,withdrawalDays=0,stock=20,threshold=5,expiryDate=str(today+timedelta(days=365))))
def animal(suffix):
    return call("user","/farmers/"+str(fid)+"/animals",dict(tagNumber=tag+suffix,breed="Jersey",age=3,healthStatus="HEALTHY"),expected=201)
def booking(a):
    b=call("vet","/bookings",dict(listingId=listing["id"],farmerId=fid,animalId=a["id"],appointmentDate=str(today)))
    call("vet","/bookings/"+str(b["id"])+"/status",dict(status="ACCEPTED"),method="PATCH")
    return b
a=animal("-active")
assert "password" not in json.dumps(a)
book=booking(a)
t=call("vet","/treatments",dict(bookingId=book["id"],medicineId=medicine["id"],dose="Demo dose",quantity=2,withdrawalDays=3,treatmentDate=str(today)))
assert t["status"]=="COMPLETED" and t["blockCreated"] and t["stockDeducted"]
call("vet","/treatments/"+str(t["id"])+"/retry",{})
assert call("pharmacy","/medicines/"+str(medicine["id"]))["stock"]==18
call("milk","/milk-records",dict(animalId=a["id"],farmerId=fid,recordDate=str(today),litres=10))
blocked=call("milk","/milk-sales",dict(animalId=a["id"],farmerId=fid,litres=1,pricePerLitre=40),expected=409)
assert "withdrawal" in blocked["message"]
e=call("milk","/animals/"+str(a["id"])+"/eligibility")
assert not e["allowed"] and e["remainingDays"]==4
print("PASS: antibiotic treatment, inclusive withdrawal, sale rejection and retry-safe stock.")
a2=animal("-expired");b2=booking(a2)
t2=call("vet","/treatments",dict(bookingId=b2["id"],medicineId=medicine["id"],dose="Historical demo",quantity=1,withdrawalDays=3,treatmentDate=str(today-timedelta(days=5))))
# Historical withdrawal milk remains unsafe even after the end date.
call("milk","/milk-records",dict(animalId=a2["id"],farmerId=fid,recordDate=str(today-timedelta(days=4)),litres=10))
call("milk","/milk-sales",dict(animalId=a2["id"],farmerId=fid,litres=1,pricePerLitre=40),expected=409)
call("milk","/milk-records",dict(animalId=a2["id"],farmerId=fid,recordDate=str(today),litres=5))
call("milk","/milk-sales",dict(animalId=a2["id"],farmerId=fid,litres=2,pricePerLitre=40))
call("milk","/milk-sales",dict(animalId=a2["id"],farmerId=fid,litres=4,pricePerLitre=40),expected=409)
call("vet","/vaccinations",dict(bookingId=b2["id"],medicineId=vaccine["id"],dose="Demo dose",quantity=1,vaccinationDate=str(today)))
call("vet","/ratings",dict(bookingId=b2["id"],score=5,comment="Complete visit"))
print("PASS: expiry allows fresh milk, unsafe historic milk excluded, overselling blocked, vaccination and rating.")
a3=animal("-boundary"); b3=booking(a3)
boundary=call("vet","/treatments",dict(bookingId=b3["id"],medicineId=medicine["id"],dose="Boundary demo",quantity=100,withdrawalDays=3,treatmentDate=str(today-timedelta(days=3))),expected=503)
pending=next(x for x in call("vet","/treatments") if x["booking"]["id"]==b3["id"])
assert pending["blockCreated"] and not pending["stockDeducted"]
e=call("milk","/animals/"+str(a3["id"])+"/eligibility")
assert not e["allowed"] and e["remainingDays"]==1
stock=call("pharmacy","/medicines/"+str(medicine["id"]))
stock["stock"]=150
call("pharmacy","/medicines/"+str(medicine["id"]),{k:stock[k] for k in ["name","type","antibiotic","withdrawalDays","stock","threshold","expiryDate"]},method="PUT")
call("vet","/treatments/"+str(pending["id"])+"/retry",{})
call("vet","/treatments/"+str(pending["id"])+"/retry",{})
assert call("pharmacy","/medicines/"+str(medicine["id"]))["stock"]==50
# Keep a second item below threshold for the low-stock report.
call("pharmacy","/medicines",dict(name="Low stock "+tag,type="MEDICINE",antibiotic=False,withdrawalDays=0,stock=1,threshold=10,expiryDate=str(today+timedelta(days=365))))
print("PASS: end-date boundary, conservative partial failure, restock and retry exactly once.")
for report in ["withdrawal","top-vets","low-stock","attention","unvaccinated","treated-vaccinated"]:
    rows=call("pharmacy","/reports/"+report)
    assert isinstance(rows,list)
    if report in ["withdrawal","low-stock","attention","unvaccinated","treated-vaccinated"]:assert rows,report
    print("PASS: SQL report",report)
print("All end-to-end checks passed.")

