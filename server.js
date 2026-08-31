const http = require("http");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8"
  });

  res.end(JSON.stringify({
    status: "online",
    message: "JPM Mobile Backend está funcionando!",
    version: "1.0.0"
  }));
});

server.listen(PORT, () => {
  console.log(`JPM Backend rodando na porta ${PORT}`);
});
