const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9bqnm.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 })

async function run() {
    try {
        await client.connect()
        const inventoryCollection = client.db('carInventory').collection('car')

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

        app.put('/car/:id', async (req, res) => {
            const id = req.params.id
            const updatedData = req.body
            const filter = { _id: ObjectId(id) }
            const updatedDoc = { $set: updatedData }
            const options = { upsert: true }
            const result = await inventoryCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
        })
    } finally {
    }
}

run().catch(console.dir)

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('Server is running')
})

app.listen(port, () => {
    console.log('Listening to port', port)
})
