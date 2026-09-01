
  
const http = require("http");

const PORT = process.env.PORT || 3000;

const users = [];
const posts = [];

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });

  res.end(JSON.stringify(data));
}

function readBody(req, callback) {
  let body = "";

  req.on("data", chunk => {
    body += chunk;
  });

  req.on("end", () => {
    try {
      callback(null, JSON.parse(body));
    } catch (error) {
      callback(error, null);
    }
  });
}

const server = http.createServer((req, res) => {

  if (req.method === "OPTIONS") {
    return sendJSON(res, 200, { status: "ok" });
  }

  // STATUS
  if (req.method === "GET" && req.url === "/api/status") {
    return sendJSON(res, 200, {
      status: "online",
      message: "JPM Mobile Backend está funcionando!",
      version: "2.0.0"
    });
  }

  // CRIAR CONTA
  if (req.method === "POST" && req.url === "/api/register") {
    return readBody(req, (error, data) => {

      if (error) {
        return sendJSON(res, 400, {
          success: false,
          message: "Dados enviados não são válidos."
        });
      }

      const name = String(data.name || "").trim();
      const phone = String(data.phone || "").trim();
      const password = String(data.password || "");

      if (!name || !phone || !password) {
        return sendJSON(res, 400, {
          success: false,
          message: "Nome, telefone e senha são obrigatórios."
        });
      }

      if (password.length < 6) {
        return sendJSON(res, 400, {
          success: false,
          message: "A senha deve ter pelo menos 6 caracteres."
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
        phone,
        password
      };

      users.push(user);

      return sendJSON(res, 201, {
        success: true,
        message: "Conta criada com sucesso!",
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone
        }
      });
    });
  }

  // LOGIN
  if (req.method === "POST" && req.url === "/api/login") {
    return readBody(req, (error, data) => {

      if (error) {
        return sendJSON(res, 400, {
          success: false,
          message: "Dados inválidos."
        });
      }

      const phone = String(data.phone || "").trim();
      const password = String(data.password || "");

      if (!phone || !password) {
        return sendJSON(res, 400, {
          success: false,
          message: "Telefone e senha são obrigatórios."
        });
      }

      const user = users.find(
        user => user.phone === phone && user.password === password
      );

      if (!user) {
        return sendJSON(res, 401, {
          success: false,
          message: "Telefone ou senha incorretos."
        });
      }

      return sendJSON(res, 200, {
        success: true,
        message: "Login realizado com sucesso!",
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone
        }
      });
    });
  }

  // LISTAR UTILIZADORES
  if (req.method === "GET" && req.url === "/api/users") {
    return sendJSON(res, 200, {
      success: true,
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        phone: user.phone
      }))
    });
  }

  // CRIAR PUBLICAÇÃO
  if (req.method === "POST" && req.url === "/api/posts") {
    return readBody(req, (error, data) => {

      if (error) {
        return sendJSON(res, 400, {
          success: false,
          message: "Dados inválidos."
        });
      }

      const userId = Number(data.userId);
      const content = String(data.content || "").trim();

      const user = users.find(user => user.id === userId);

      if (!user) {
        return sendJSON(res, 404, {
          success: false,
          message: "Utilizador não encontrado."
        });
      }

      if (!content) {
        return sendJSON(res, 400, {
          success: false,
          message: "A publicação não pode estar vazia."
        });
      }

      const post = {
        id: posts.length + 1,
        userId: user.id,
        author: user.name,
        content,
        likes: 0,
        createdAt: new Date().toISOString()
      };

      posts.push(post);

      return sendJSON(res, 201, {
        success: true,
        message: "Publicação criada!",
        post
      });
    });
  }

  // LISTAR PUBLICAÇÕES
  if (req.method === "GET" && req.url === "/api/posts") {
    return sendJSON(res, 200, {
      success: true,
      posts: [...posts].reverse()
    });
  }

  // ROTA NÃO ENCONTRADA
  return sendJSON(res, 404, {
    success: false,
    message: "Rota não encontrada."
  });
});

server.listen(PORT, () => {
  console.log(`JPM Backend rodando na porta ${PORT}`);
});
