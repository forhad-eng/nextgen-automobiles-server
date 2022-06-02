const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const accessToken = authHeader.split(' ')[1]
    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded
        next()
    })
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9bqnm.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 })

async function run() {
    try {
        await client.connect()
        const inventoryCollection = client.db('carInventory').collection('car')
        const soldCollection = client.db('carInventory').collection('sold')
        const userCollection = client.db('carInventory').collection('user')

        //Users
        app.get('/user', async (req, res) => {
            const result = await userCollection.find().toArray()
            res.send(result)
        })

        app.get('/user/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email
            const user = await userCollection.findOne({ email })
            const isAdmin = user.role === 'admin'
            res.send({ admin: isAdmin })
        })

        app.patch('/user/:email', verifyJWT, async (req, res) => {
            const email = req.params.email
            const filter = { email }
            const updatedDoc = { $set: { role: 'admin' } }
            const result = await userCollection.updateOne(filter, updatedDoc)
            if (result.modifiedCount) {
                res.send({ success: true, message: 'Make admin success' })
            }
        })

        app.put('/user', async (req, res) => {
            const user = req.body
            const email = user.email
            const filter = { email }
            const options = { upsert: true }
            const updatedDoc = { $set: user }
            const accessToken = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
            await userCollection.updateOne(filter, updatedDoc, options)
            res.send({ accessToken })
        })

        //sold car APIs
        app.get('/sell', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email
            const email = req.query.email
            if (email === decodedEmail) {
                const query = { email }
                const cursor = soldCollection.find(query)
                const result = await cursor.toArray()
                res.send(result)
            }
        })

        app.post('/sell', async (req, res) => {
            const soldItem = req.body
            const result = await soldCollection.insertOne(soldItem)
            res.send(result)
        })

        app.delete('/sell/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await soldCollection.deleteOne(query)
            res.send(result)
        })

        //Inventory APIs
        app.get('/car', async (req, res) => {
            const cursor = inventoryCollection.find({})
            const cars = await cursor.toArray()
            res.send(cars)
        })

        app.get('/car/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await inventoryCollection.findOne(query)
            res.send(result)
        })

        app.post('/car', async (req, res) => {
            const item = req.body
            const result = await inventoryCollection.insertOne(item)
            res.send(result)
        })

        app.put('/car/:id', async (req, res) => {
            const id = req.params.id
            const updatedData = req.body
            const filter = { _id: ObjectId(id) }
            const updatedDoc = { $set: updatedData }
            const options = { upsert: true }
            const result = await inventoryCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
        })

        app.delete('/car/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await inventoryCollection.deleteOne(query)
            res.send(result)
        })
    } finally {
    }
}

run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('Server is running')
})

app.listen(port, () => {
    console.log('Listening to port', port)
})
