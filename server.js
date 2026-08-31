const http = require("http");

const PORT = process.env.PORT || 3000;

const users = [];

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });

  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {

  if (req.method === "OPTIONS") {
    return sendJSON(res, 200, { status: "ok" });
  }

  if (req.method === "GET" && req.url === "/api/status") {
    return sendJSON(res, 200, {
      status: "online",
      message: "JPM Mobile Backend está funcionando!",
      version: "1.1.0"
    });
  }

  if (req.method === "POST" && req.url === "/api/register") {
    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body);

        const name = String(data.name || "").trim();
        const phone = String(data.phone || "").trim();
        const password = String(data.password || "");

        if (!name || !phone || !password) {
          return sendJSON(res, 400, {
            success: false,
            message: "Nome, telefone e senha são obrigatórios."
          });
        }

        const existingUser = users.find(user => user.phone === phone);

        if (existingUser) {
          return sendJSON(res, 409, {
            success: false,
            message: "Este número já está cadastrado."
          });
        }

        const user = {
          id: users.length + 1,
          name,
          phone
        };

        users.push({
          ...user,
          password
        });

        return sendJSON(res, 201, {
          success: true,
          message: "Conta criada com sucesso!",
          user
        });

      } catch (error) {
        return sendJSON(res, 400, {
          success: false,
          message: "Dados enviados não são válidos."
        });
      }
    });

    return;
  }

  sendJSON(res, 404, {
    success: false,
    message: "Rota não encontrada."
  });
});

server.listen(PORT, () => {
  console.log(`JPM Backend rodando na porta ${PORT}`);
});
