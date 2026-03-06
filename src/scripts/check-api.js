fetch("http://localhost:3000/api/admin/verification?status=PENDING&type=CLIENT")
  .then(r => r.json())
  .then(data => {
      console.log(JSON.stringify(data.data.slice(0, 1), null, 2));
  });
