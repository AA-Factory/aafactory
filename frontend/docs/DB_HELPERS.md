Complete reset (database + files):
curl -X POST http://localhost:3000/api/dev/db?type=all

Database collections only:
curl -X POST http://localhost:3000/api/dev/db?type=collections

Files only:
curl -X POST http://localhost:3000/api/dev/db?type=files

Selective reset - specific collections:
curl -X POST
"http://localhost:3000/api/dev/db?type=selective&collections=avatars,tasks"

Selective reset - specific folders:
curl -X POST
"http://localhost:3000/api/dev/db?type=selective&folders=video,audio"

Combined selective reset:
curl -X POST "http://localhost:3000/api/dev/db?type=selective&collections=avata
rs&folders=image"

Or if you prefer using your browser's developer console:
fetch('/api/dev/db?type=all', { method: 'POST' })
.then(r => r.json())
.then(console.log)

curl -X POST http://localhost:3000/api/containers/manage \
 -H "Content-Type: application/json" \
 -H "Authorization: Bearer your-secret-token" \
 -d '{"action": "rebuild-compose", "serviceName": "flower"}'

curl -X POST http://aafactory-demo.xyz/api/containers/manage -H "Content-Type: application/json" -H "Authorization: Bearer your-secret-token" -d '{"action": "list"}'
