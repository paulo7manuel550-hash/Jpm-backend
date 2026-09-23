
const http = require("http");

const PORT = process.env.PORT || 3000;

const users = [];
const posts = [];
const likes = [];
const commentLikes = [];
const comments = [];
const follows = [];
const notifications = [];

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
if (req.method === "GET" && req.url.startsWith("/api/users")) {

  return sendJSON(res, 200, {
    success: true,

    users: users.map(user => {
const userId = Number(
  new URL(req.url, "http://localhost").searchParams.get("userId")
);
      const followersCount = follows.filter(
        follow => follow.followingId === user.id
      ).length;

      const followingCount = follows.filter(
        follow => follow.followerId === user.id
      ).length;
const following = follows.some(
  follow =>
    follow.followerId === userId &&
    follow.followingId === user.id
);
return {
  id: user.id,
  name: user.name,
  phone: user.phone,
  followersCount: followersCount,
  followingCount: followingCount,
  following: following
};

    })
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
if (req.method === "GET" && req.url.startsWith("/api/posts")) {

  const userId = Number(
    new URL(req.url, "http://localhost").searchParams.get("userId")
  );

  return sendJSON(res, 200, {
    success: true,

    posts: [...posts].reverse().map(post => {

      const liked = likes.some(
        like =>
          like.postId === post.id &&
          like.userId === userId
      );

      return {
        ...post,
        liked: liked
      };

    })
  });

}
  
// CURTIR PUBLICAÇÃO
if (req.method === "POST" && req.url.startsWith("/api/posts/") && req.url.endsWith("/like")) {
  const parts = req.url.split("/");
  const postId = Number(parts[3]);

  return readBody(req, (error, data) => {

    if (error) {
      return sendJSON(res, 400, {
        success: false,
        message: "Dados inválidos."
      });
    }

    const userId = Number(data.userId);

    const post = posts.find(post => post.id === postId);
    const user = users.find(user => user.id === userId);

    if (!post) {
      return sendJSON(res, 404, {
        success: false,
        message: "Publicação não encontrada."
      });
    }

    if (!user) {
      return sendJSON(res, 404, {
        success: false,
        message: "Utilizador não encontrado."
      });
    }

    const existingLike = likes.find(
      like => like.postId === postId && like.userId === userId
    );

    if (existingLike) {
      likes.splice(likes.indexOf(existingLike), 1);
      post.likes = Math.max(0, post.likes - 1);

      return sendJSON(res, 200, {
        success: true,
        liked: false,
        likes: post.likes,
        message: "Curtida removida."
      });
    }

    likes.push({
      postId,
      userId
    });

    post.likes += 1;

    return sendJSON(res, 200, {
      success: true,
      liked: true,
      likes: post.likes,
      message: "Publicação curtida!"
    });
  });
}
  // CRIAR COMENTÁRIO
if (req.method === "POST" && req.url === "/api/comments") {
  return readBody(req, (error, data) => {

    if (error) {
      return sendJSON(res, 400, {
        success: false,
        message: "Dados inválidos."
      });
    }

    const postId = Number(data.postId);
    const userId = Number(data.userId);
    const content = String(data.content || "").trim();

    const post = posts.find(post => post.id === postId);
    const user = users.find(user => user.id === userId);

    if (!post) {
      return sendJSON(res, 404, {
        success: false,
        message: "Publicação não encontrada."
      });
    }

    if (!user) {
      return sendJSON(res, 404, {
        success: false,
        message: "Utilizador não encontrado."
      });
    }

    if (!content) {
      return sendJSON(res, 400, {
        success: false,
        message: "O comentário não pode estar vazio."
      });
    }

    const comment = {
      id: comments.length + 1,
      postId,
      userId,
      author: user.name,
      content,
      createdAt: new Date().toISOString()
    };

    comments.push(comment);

    return sendJSON(res, 201, {
      success: true,
      message: "Comentário publicado!",
      comment
    });
  });
}
  
// CURTIR COMENTÁRIO
if (
  req.method === "POST" &&
  req.url.startsWith("/api/comments/") &&
  req.url.endsWith("/like")
) {

  const parts = req.url.split("/");
  const commentId = Number(parts[3]);

  return readBody(req, (error, data) => {

    if (error) {
      return sendJSON(res, 400, {
        success: false,
        message: "Dados inválidos."
      });
    }

    const userId = Number(data.userId);

    const comment = comments.find(
      comment => comment.id === commentId
    );

    const user = users.find(
      user => user.id === userId
    );

    if (!comment) {
      return sendJSON(res, 404, {
        success: false,
        message: "Comentário não encontrado."
      });
    }

    if (!user) {
      return sendJSON(res, 404, {
        success: false,
        message: "Utilizador não encontrado."
      });
    }

    const existingLike = commentLikes.find(
      like =>
        like.commentId === commentId &&
        like.userId === userId
    );

    if (existingLike) {

      commentLikes.splice(
        commentLikes.indexOf(existingLike),
        1
      );

      const likesCount = commentLikes.filter(
        like => like.commentId === commentId
      ).length;

      return sendJSON(res, 200, {
        success: true,
        liked: false,
        likes: likesCount,
        message: "Curtida do comentário removida."
      });
    }

    commentLikes.push({
      commentId,
      userId
    });

    const likesCount = commentLikes.filter(
      like => like.commentId === commentId
    ).length;

    return sendJSON(res, 200, {
      success: true,
      liked: true,
      likes: likesCount,
      message: "Comentário curtido!"
    });

  });
}

// LISTAR COMENTÁRIOS
if (req.method === "GET" && req.url.startsWith("/api/comments/")) {

  const url = new URL(
    req.url,
    "http://localhost"
  );

  const postId = Number(
    url.pathname.split("/")[3]
  );

  const userId = Number(
    url.searchParams.get("userId")
  );

  const postComments = comments
    .filter(comment => comment.postId === postId)
    .map(comment => {

      const likesCount = commentLikes.filter(
        like => like.commentId === comment.id
      ).length;

      const liked = commentLikes.some(
        like =>
          like.commentId === comment.id &&
          like.userId === userId
      );

      return {
        ...comment,
        likes: likesCount,
        liked: liked
      };

    });

  return sendJSON(res, 200, {
    success: true,
    comments: postComments
  });
}
// SEGUIR / DEIXAR DE SEGUIR UTILIZADOR
if (
  req.method === "POST" &&
  req.url.startsWith("/api/users/") &&
  req.url.endsWith("/follow")
) {

  const parts = req.url.split("/");
  const targetUserId = Number(parts[3]);

  return readBody(req, (error, data) => {

    if (error) {
      return sendJSON(res, 400, {
        success: false,
        message: "Dados inválidos."
      });
    }

    const userId = Number(data.userId);

    const user = users.find(
      user => user.id === userId
    );

    const targetUser = users.find(
      user => user.id === targetUserId
    );

    if (!user || !targetUser) {
      return sendJSON(res, 404, {
        success: false,
        message: "Utilizador não encontrado."
      });
    }

    if (userId === targetUserId) {
      return sendJSON(res, 400, {
        success: false,
        message: "Não podes seguir a tua própria conta."
      });
    }

    const existingFollow = follows.find(
      follow =>
        follow.followerId === userId &&
        follow.followingId === targetUserId
    );

    // DEIXAR DE SEGUIR
    if (existingFollow) {

      follows.splice(
        follows.indexOf(existingFollow),
        1
      );

      return sendJSON(res, 200, {
        success: true,
        following: false,
        message: "Deixaste de seguir este utilizador."
      });
    }

    // SEGUIR
    follows.push({
      followerId: userId,
      followingId: targetUserId
    });
notifications.push({
  id: notifications.length + 1,
  userId: targetUserId,
  fromUserId: userId,
  type: "follow",
  message: `${user.name} começou a seguir-te.`,
  read: false,
  createdAt: new Date().toISOString()
});
    return sendJSON(res, 200, {
      success: true,
      following: true,
      message: "Agora estás a seguir este utilizador!"
    });

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
