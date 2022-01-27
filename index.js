const express = require("express");
const app = express();
const cors = require("cors");
const admin = require("firebase-admin"); //
require("dotenv").config();
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xbjvx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

async function run() {
    try {
        await client.connect();
        const database = client.db("Travel_Agency_Portal");
        const servicesCollection = database.collection("services");
        const reviewsCollection = database.collection("reviews");
        const usersCollection = database.collection("users");

        // get services data
        app.get("/services", async (req, res) => {
            const cursor = servicesCollection.find({});
            const count = await cursor.count();
            const page = req.query.page;
            const size = parseInt(req.query.size);
            let services;
            if (page) {
                services = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                services = await cursor.toArray();
            }
            res.send({
                count,
                services
            });
        });
        // post service data

        app.post("/services", async (req, res) => {
            const product = req.body;
            const result = await servicesCollection.insertOne(product);
            res.json(result);
        });
        // get single service

        app.get("/services/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await servicesCollection.findOne(query);
            res.json(result);
        });

        // delete single service

        app.delete("/services/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await servicesCollection.deleteOne(query);
            res.json(result);
        });
        // get user data

        app.get("/users/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === "admin") {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        });

        // post user

        app.post("/users", async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        });

        // add user admin

        app.put("/users/admin", async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const updateDoc = { $set: { role: "admin" } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);
        });

        // upsert user

        app.put("/users", async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(
                filter,
                updateDoc,
                options
            );
            res.json(result);
        });

    } finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Hello Travel Agency");
});

app.listen(port, () => {
    console.log(` listening at ${port}`);
});
