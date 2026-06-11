@echo off
chcp 65001 >nul
echo === HEALTH ===
curl -s -w "STATUS:%{http_code}\n" http://localhost:7777/api/v1/health
echo === EVENTS_MY ===
curl -s -w "STATUS:%{http_code}\n" -H "Authorization: Bearer u_test001" http://localhost:7777/api/v1/events/my
echo === EVENTS_POST ===
curl -s -w "STATUS:%{http_code}\n" -X POST -H "Authorization: Bearer u_test001" -H "Content-Type: application/json" -d "{\"title\":\"hi\",\"startTime\":\"2026-06-08T10:00:00Z\",\"endTime\":\"2026-06-08T11:00:00Z\"}" http://localhost:7777/api/v1/events
echo === EVENTS_POST_BAD ===
curl -s -w "STATUS:%{http_code}\n" -X POST -H "Authorization: Bearer u_test001" -H "Content-Type: application/json" -d "{\"title\":\"hi\"}" http://localhost:7777/api/v1/events
echo === Server log tail ===
powershell -Command "Get-Content C:\Users\xwhy7\timeslots-v1\server\server.log -Tail 10"
