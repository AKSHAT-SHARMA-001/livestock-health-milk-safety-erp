"""Validation, ownership and concurrency checks using only this test's synthetic records."""
import runpy
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from pathlib import Path

state = runpy.run_path(str(Path(__file__).with_name("smoke-test.py")))
call, fid, today = state["call"], state["fid"], state["today"]
a, a2, farmer = state["a"], state["a2"], state["farmer"]
tag = state["tag"]
call("user", "/auth/login", dict(email=farmer["email"], password="wrong"), expected=400)
call("user", "/auth/register/farmer", dict(name="Duplicate", email=farmer["email"], password="Demo123!", village="Test"), expected=400)
call("user", "/animals/999999999", expected=404)
call("user", "/farmers/"+str(fid)+"/animals", dict(tagNumber="",breed="Test",age=-1,healthStatus="HEALTHY"), expected=400)
call("user", "/animals/"+str(a2["id"]), dict(tagNumber=a["tagNumber"],breed="Test",age=2,healthStatus="HEALTHY"), method="PUT", expected=409)
call("vet", "/bookings/"+str(state["book"]["id"])+"/status",dict(status="REJECTED"),method="PATCH",expected=409)
call("vet", "/ratings",dict(bookingId=state["b2"]["id"],score=6,comment="Invalid"),expected=400)
call("vet", "/ratings",dict(bookingId=state["b2"]["id"],score=5,comment="Duplicate"),expected=409)
call("pharmacy", "/reports/not-a-report", expected=400)
call("pharmacy", "/reports/withdrawal", token=farmer["token"], expected=403)
call("pharmacy", "/stock/deduct",dict(requestKey="forbidden-"+tag,medicineId=state["medicine"]["id"],quantity=1),token=farmer["token"],expected=403)
call("milk", "/withdrawal-blocks",dict(treatmentId=999999,animalId=a["id"],farmerId=fid,startDate=str(today),endDate=str(today),medicine="Test"),token=farmer["token"],expected=403)
call("milk", "/milk-records",dict(animalId=a2["id"],farmerId=fid,recordDate=str(today),litres=-1),expected=400)
call("milk", "/milk-records",dict(animalId=a2["id"],farmerId=fid,recordDate=str(today+timedelta(days=1)),litres=1),expected=400)
call("milk", "/milk-sales",dict(animalId=a2["id"],farmerId=fid,litres=1,pricePerLitre=0),expected=400)
call("milk", "/milk-records",dict(animalId=a2["id"],farmerId=999999,recordDate=str(today),litres=1),expected=400)
expired=call("pharmacy","/medicines",dict(name="Expired "+tag,type="MEDICINE",antibiotic=False,withdrawalDays=0,stock=5,threshold=1,expiryDate=str(today-timedelta(days=1))))
call("pharmacy","/stock/deduct",dict(requestKey="expired-"+tag,medicineId=expired["id"],quantity=1),expected=409)
print("PASS: invalid input, duplicates, ownership, expired stock and internal-only operations.")

# The helper asserts a supplied status; try both known outcomes without retrying writes.
import json, urllib.request, urllib.error, os
def post(service, route, body):
    request=urllib.request.Request(state["BASE"][service]+"/api"+route,data=json.dumps(body).encode(),headers={"Content-Type":"application/json","X-Service-Key":os.getenv("SERVICE_KEY","academic-local-service-key")})
    try:
        with urllib.request.urlopen(request,timeout=20) as response:return response.status
    except urllib.error.HTTPError as e:return e.code
medicine=call("pharmacy","/medicines",dict(name="Concurrency "+tag,type="MEDICINE",antibiotic=False,withdrawalDays=0,stock=5,threshold=1,expiryDate=str(today+timedelta(days=90))))
with ThreadPoolExecutor(max_workers=8) as pool:
    statuses=list(pool.map(lambda i:post("pharmacy","/stock/deduct",dict(requestKey=tag+"-parallel-"+str(i),medicineId=medicine["id"],quantity=1)),range(10)))
assert statuses.count(200)==5 and statuses.count(409)==5,statuses
assert call("pharmacy","/medicines/"+str(medicine["id"]))["stock"]==0
with ThreadPoolExecutor(max_workers=5) as pool:
    statuses=list(pool.map(lambda _:post("milk","/milk-sales",dict(animalId=a2["id"],farmerId=fid,litres=1,pricePerLitre=40)),range(5)))
assert statuses.count(200)==3 and statuses.count(409)==2,statuses
print("PASS: simultaneous deductions cannot make stock negative; simultaneous sales cannot oversell safe milk.")
