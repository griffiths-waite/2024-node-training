import express, { Request, Response } from "express";
import { JwtPayload, sign, verify } from "jsonwebtoken";
import bodyParser from "body-parser";

import { books } from "./books";
import { films } from "./films";

const app = express();
app.use(bodyParser.json());

const port = 3000;

app.get("/", (req: Request, res: Response) => {
  const base64String = Buffer.from("wearegw").toString("base64");

  const response = JSON.stringify({ data: { secret: base64String } });
  res.send(response);
});

app.get("/books", (req: Request, res: Response) => {
  const booksWithId = books.map((book, index) => {
    return { id: index, ...book };
  });
  const response = JSON.stringify({ data: booksWithId });
  res.send(response);
});

app.get("/books/:id", (req: Request, res: Response) => {
  const id: string = req.params["id"];

  const numericalId = Number(id);

  if (Number.isNaN(numericalId)) {
    return res.status(400).send({ error: "id is not a number" });
  }

  if (numericalId === 1000) {
    const response = JSON.stringify({
      data: {
        id: 1000,
        author: "Dan Curtis",
        country: "United Kingdom",
        language: "English",
        link: "https://www.amazon.co.uk/Practical-Oracle-JET-Developing-Applications/dp/1484243455",
        pages: 255,
        title:
          "Practical Oracle JET: Developing Enterprise Applications in JavaScript",
        year: 2019,
        copiesSold: 15,
      },
    });
    return res.setHeader("x-secret", "wearegw").send(response);
  }

  const [bookWithId] = books
    .map((book, index) => {
      return { id: index, ...book };
    })
    .filter((book) => book.id === numericalId);

  const response = JSON.stringify({ data: bookWithId });
  return res.send(response);
});

app.get("/films", (req: Request, res: Response) => {
  const neededHeader = req.headers["x-custom-header"];

  if (!neededHeader || typeof neededHeader !== "string") {
    return res
      .status(400)
      .send({ error: "x-custom-header is missing or not a string" });
  }

  const response = JSON.stringify({ data: films });
  res.send(response).setHeader("x-custom-header", neededHeader);
});

app.get("/token", (req: Request, res: Response) => {
  const username = req.headers["x-username"];

  if (!username) {
    return res.status(400).send({ error: "x-username is missing" });
  }

  if (typeof username !== "string") {
    return res.status(400).send({ error: "x-username is wrong type" });
  }

  const acceptedUsernames = [
    "milad.amini@griffiths-waite.co.uk",
    "mark.elbre@griffiths-waite.co.uk",
    "om.patel@griffiths-waite.co.uk",
    "maha.hussain@griffiths-waite.co.uk",
    "dan.beglin@griffiths-waite.co.uk",
  ];

  if (!acceptedUsernames.includes(username)) {
    return res.status(401).send({ error: "Not authorised" });
  }

  const data = {
    username: username,
    date: new Date(),
    secretToken: "wearegw",
  };

  const token = sign(data, "actuallyasecret");

  res.status(200).send({ data: { token } });
});

interface Token {
  username: string;
  date: string;
  secretToken: string;
  iat: Date;
}

app.post("/secret", (req: Request, res: Response) => {
  if (!req.body || !req.body.token) {
    return res.status(400).send({ error: "token missing" });
  }

  const token = verify(req.body.token, "actuallyasecret") as unknown as Token;

  if (token.secretToken === "wearegw") {
    res.status(201).send("You have completed session 0 - well done");
  } else {
    res.status(401).send("Not authorised");
  }
});

// Server
const server = app.listen(port, () => {
  console.log(`Training app listening on port ${port}`);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error({ reason, promise }, "Unhandled promise rejection.");
});

process.on("SIGTERM", () => {
  console.info("Received SIGTERM, Gracefully shutting down API.");

  server.close(() => {
    console.info(
      "Cleanup process complete. If you see this log, The server has closed before it received a SIGKILL signal."
    );
  });
});
