"""Populate the demo accounts using real APIs; reruns reuse existing sample records."""
import json
import os
from datetime import date, timedelta
from urllib.request import Request, urlopen

HOSTS = {name: os.getenv(name.upper()+"_URL","http://localhost:"+str(port)) for name,port in [("user",8081),("vet",8082),("pharmacy",8083),("milk",8084)]}
def api(service,path,body=None,method=None):
    request=Request(HOSTS[service]+"/api"+path,
        data=None if body is None else json.dumps(body).encode(),
        headers={"Content-Type":"application/json","X-Service-Key":os.getenv("SERVICE_KEY","academic-local-service-key")},
        method=method or ("POST" if body is not None else "GET"))
    with urlopen(request,timeout=20) as response:
        return json.loads(response.read() or "null")

today=date.today()
farmer=api("user","/auth/login",dict(email="farmer@demo.local",password="Demo123!"))
vet=api("user","/auth/login",dict(email="vet@demo.local",password="Demo123!"))
fid=farmer["farmerId"]
users=api("user","/users")
meera=next((u for u in users if u["email"]=="meera.vet@demo.local"),None)
if not meera:
    meera=api("user","/users",dict(name="Dr Meera Rao (Demo)",email="meera.vet@demo.local",password="Demo123!",role="VET",phone="0000000000"))
profiles=api("vet","/vets")
def profile(user,name,specialization):
    found=next((v for v in profiles if v["userId"]==user["userId"]),None)
    if found:return found
    created=api("vet","/vets",dict(userId=user["userId"],name=name,specialization=specialization,phone="0000000000"))
    profiles.append(created)
    return created
primary=profile(vet,"Demo veterinarian","Dairy animal care")
secondary=profile(dict(userId=meera["id"]),"Dr Meera Rao (Demo)","Preventive care")
extra_vets = []
for name, email, specialty, offerings in [
    ("Dr Arjun Nair (Sample)", "arjun.vet@demo.local", "Dairy medicine", [("General dairy examination",550,True),("Udder health assessment",650,True)]),
    ("Dr Kavya Iyer (Sample)", "kavya.vet@demo.local", "Preventive care", [("Calf health check",450,True),("Vaccination planning",350,True)]),
    ("Dr Nisha Verma (Sample)", "nisha.vet@demo.local", "Nutrition and herd management", [("Feed and nutrition consultation",400,True),("Herd health review",900,True)]),
    ("Dr Dev Menon (Sample)", "dev.vet@demo.local", "Reproductive health", [("Reproductive health consultation",700,True),("Follow-up visit",450,False)]),
]:
    account = next((u for u in users if u["email"] == email), None)
    if not account:
        account = api("user","/users",dict(name=name,email=email,password="Demo123!",role="VET",phone=""))
    extra_vets.append((profile(dict(userId=account["id"]),name,specialty), offerings))
listings=api("vet","/services")
def listing(vet,title,price,available=True):
    found=next((x for x in listings if x["vet"]["id"]==vet["id"] and x["title"]==title),None)
    if found:return found
    x=api("vet","/services",dict(vetId=vet["id"],title=title,price=price,available=available))
    listings.append(x)
    return x
checkup=listing(primary,"General health check",500)
vaccination=listing(primary,"Vaccination visit",350)
followup=listing(secondary,"Milk safety follow-up",400)
for vet_profile, offerings in extra_vets:
    for title, price, available in offerings:
        listing(vet_profile, title, price, available)
animals=api("user","/farmers/"+str(fid)+"/animals")
herd={}
for tag,breed,age,status in [("DEMO-101","Gir",4,"HEALTHY"),("DEMO-102","Jersey",3,"HEALTHY"),("DEMO-103","Holstein Friesian",5,"UNDER TREATMENT"),("DEMO-104","Sahiwal",2,"HEALTHY")]:
    animal=next((a for a in animals if a["tagNumber"]==tag),None)
    if not animal:
        animal=api("user","/farmers/"+str(fid)+"/animals",dict(tagNumber=tag,breed=breed,age=age,healthStatus=status))
    herd[tag]=animal
items=api("pharmacy","/medicines")
def medicine(name,type,antibiotic,stock,threshold,days=0):
    old=next((m for m in items if m["name"]==name),None)
    if old:return old
    m=api("pharmacy","/medicines",dict(name=name,type=type,antibiotic=antibiotic,withdrawalDays=days,stock=stock,threshold=threshold,expiryDate=str(today+timedelta(days=365))))
    items.append(m)
    return m
antibiotic=medicine("Demo antibiotic","MEDICINE",True,100,10,3)
vaccine=medicine("Demo vaccine","VACCINE",False,40,10)
medicine("Demo vaccine - low stock","VACCINE",False,4,10)
bookings=api("vet","/bookings")
def book(animal,service,day,accept=False):
    old=next((b for b in bookings if b["farmerId"]==fid and b["animalId"]==animal["id"] and b["listing"]["id"]==service["id"] and b["appointmentDate"]==str(day)),None)
    b=old or api("vet","/bookings",dict(listingId=service["id"],farmerId=fid,animalId=animal["id"],appointmentDate=str(day)))
    if not old:bookings.append(b)
    if accept and b["status"]=="PENDING":
        b=api("vet","/bookings/"+str(b["id"])+"/status",dict(status="ACCEPTED"),"PATCH")
    return b
active=book(herd["DEMO-103"],checkup,today,True)
expired=book(herd["DEMO-102"],followup,today,True)
book(herd["DEMO-101"],checkup,today+timedelta(days=1))
book(herd["DEMO-104"],vaccination,today+timedelta(days=1),True)
treatments=api("vet","/treatments")
for booking,day in [(active,today),(expired,today-timedelta(days=7))]:
    treatment=next((t for t in treatments if t["booking"]["id"]==booking["id"]),None)
    if not treatment:
        treatment=api("vet","/treatments",dict(bookingId=booking["id"],medicineId=antibiotic["id"],dose="Sample entry only",quantity=1,withdrawalDays=3,treatmentDate=str(day)))
    elif treatment["status"]!="COMPLETED":
        api("vet","/treatments/"+str(treatment["id"])+"/retry",{})
vaccines=api("vet","/vaccinations")
if not any(v["booking"]["id"]==expired["id"] for v in vaccines):
    api("vet","/vaccinations",dict(bookingId=expired["id"],medicineId=vaccine["id"],dose="Sample entry only",quantity=1,vaccinationDate=str(today)))
ratings=api("vet","/ratings")
for booking,score,comment in [(active,5,"Clear advice and a useful follow-up plan."),(expired,4,"Good check-up and vaccination visit.")]:
    if not any(r["booking"]["id"]==booking["id"] for r in ratings):
        api("vet","/ratings",dict(bookingId=booking["id"],score=score,comment=comment))
records=api("milk","/milk-records")
for tag,litres in [("DEMO-101",12.5),("DEMO-102",10.8),("DEMO-103",8.4),("DEMO-104",11.2)]:
    for offset in range(7):
        day=today-timedelta(days=offset)
        if not any(r["animalId"]==herd[tag]["id"] and r["recordDate"]==str(day) for r in records):
            api("milk","/milk-records",dict(animalId=herd[tag]["id"],farmerId=fid,recordDate=str(day),litres=round(litres-offset*.2,1)))
sales=api("milk","/milk-sales")
for tag,litres in [("DEMO-101",6.5),("DEMO-102",5)]:
    if not any(s["animalId"]==herd[tag]["id"] and s["saleDate"]==str(today) for s in sales):
        api("milk","/milk-sales",dict(animalId=herd[tag]["id"],farmerId=fid,litres=litres,pricePerLitre=42))
print("Demo data ready: four animals, six sample vets with eleven services, upcoming visits, active/expired withdrawal, vaccination, ratings, seven days of yields, and sales.")
