@echo off
chcp 65001 >nul
echo === T1: /health ===
curl -s -m 5 -w "STATUS:%{http_code}\n" http://127.0.0.1:7777/api/v1/health
echo === T2: /events/my 401 (no auth) ===
curl -s -m 5 -w "STATUS:%{http_code}\n" http://127.0.0.1:7777/api/v1/events/my
echo === T3: /events/my 200 with stub Bearer ===
curl -s -m 5 -w "STATUS:%{http_code}\n" -H "Authorization: Bearer u_test001" http://127.0.0.1:7777/api/v1/events/my
echo === T4: POST /events 400 (missing fields) ===
curl -s -m 5 -w "STATUS:%{http_code}\n" -X POST -H "Authorization: Bearer u_test001" -H "Content-Type: application/json" -d "{}" http://127.0.0.1:7777/api/v1/events
echo === T5: POST /events 400 (endTime<=startTime) ===
curl -s -m 5 -w "STATUS:%{http_code}\n" -X POST -H "Authorization: Bearer u_test001" -H "Content-Type: application/json" -d "{\"title\":\"x\",\"startTime\":\"2026-06-08T11:00:00Z\",\"endTime\":\"2026-06-08T10:00:00Z\"}" http://127.0.0.1:7777/api/v1/events
echo === T6: POST /events 201 (real create, no Quota row) ===
curl -s -m 5 -w "STATUS:%{http_code}\n" -X POST -H "Authorization: Bearer u_test001" -H "Content-Type: application/json" -d "{\"title\":\"smoke\",\"startTime\":\"2026-06-08T10:00:00Z\",\"endTime\":\"2026-06-08T11:00:00Z\"}" http://127.0.0.1:7777/api/v1/events
