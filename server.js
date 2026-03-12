const dotenv = require("dotenv");
dotenv.config();
const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require("passport");
const passportJWT = require("passport-jwt");
const cors = require("cors");
const userService = require("./user-service.js");

const app = express();
const JWTStrategy = passportJWT.Strategy;
const ExtractJwt = passportJWT.ExtractJwt;

app.use(express.json());
app.use(cors());
app.use(passport.initialize());

// Lazy DB connection for serverless — cached after first open
app.use((req, res, next) => {
  userService.connect().then(() => next()).catch((err) => {
    res.status(500).json({ error: "Database connection failed" });
  });
});

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    (jwt_payload, next) => {
      return next(null, {
        _id: jwt_payload._id,
        userName: jwt_payload.userName,
      });
    }
  )
);

app.get("/", (req, res) => {
  res.status(200).json({ message: "success" });
})

app.post("/api/user/register", (req, res) => {
  userService
    .registerUser(req.body)
    .then((msg) => {
      res.json({ message: msg });
    })
    .catch((msg) => {
      res.status(422).json({ message: msg });
    });
});

app.post("/api/user/login", (req, res) => {
  userService
    .checkUser(req.body)
    .then((user) => {
      // res.json({ "message": "login successful"});
      const payload = {
        _id: user._id,
        userName: user.userName,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET);
      res.json({ token: token });
    })
    .catch((msg) => {
      res.status(422).json({ message: msg });
    });
});

app.get(
  "/api/user/favourites",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    userService
      .getFavourites(req.user._id)
      .then((data) => {
        res.json(data);
      })
      .catch((msg) => {
        res.status(422).json({ error: msg });
      });
  }
);

app.put("/api/user/favourites/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
  userService
    .addFavourite(req.user._id, req.params.id)
    .then((data) => {
      res.json(data);
    })
    .catch((msg) => {
      res.status(422).json({ error: msg });
    });
});

app.delete("/api/user/favourites/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    userService.removeFavourite(req.user._id, req.params.id)
    .then(data => {
        res.json(data)
    }).catch(msg => {
        res.status(422).json({ error: msg });
    })
});

app.get("/api/user/history",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    userService.getHistory(req.user._id)
    .then(data => {
        res.json(data);
    }).catch(msg => {
        res.status(422).json({ error: msg });
    })

});

app.put("/api/user/history/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    userService.addHistory(req.user._id, req.params.id)
    .then(data => {
        res.json(data)
    }).catch(msg => {
        res.status(422).json({ error: msg });
    })
});

app.delete("/api/user/history/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    userService.removeHistory(req.user._id, req.params.id)
    .then(data => {
        res.json(data)
    }).catch(msg => {
        res.status(422).json({ error: msg });
    })
});

module.exports = app;