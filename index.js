const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const port = process.env.PORT || 5000;
const cors = require('cors');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tort7uo.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
app.use(cors());
app.use(express.json());
const verifyJWT = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    req.user = user;
    next();
  });
};
app.post('/jwt', (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5h' })
  res.send({ token })
})


async function run() {
  try {
    await client.connect();
    const infoCollection = client.db('unihub').collection('info');
    const temporaryinfoCollection = client.db('unihub').collection('temporaryinfo');
    const userCollection = client.db('unihub').collection('users');

    app.get('/info', async (req, res) => {
      try {
        const destinations = await infoCollection.find().toArray();
        console.log(destinations);
        res.json(destinations);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve destinations' });
      }
    });
    app.post('/info', async (req, res) => {
      let universityData = req.body;
    
      try {
        // Handle the received data as needed
        console.log('Received University Data:', universityData);
    
        // Remove the existing _id
        delete universityData._id;
    
        // Generate a new ObjectId for the data
        universityData._id = new ObjectId();
    
        // Insert data into the MongoDB collection
        const result = await infoCollection.insertOne(universityData);
    
        // Send the result back to the frontend
        res.status(200).json({ message: 'Data received and inserted successfully.', result });
      } catch (error) {
        console.error('Error during insertion:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
    
  
    
    
    app.post('/temporaryinfo', async (req, res) => {
      const universityData = req.body.universityData;

      try {
        // Handle the received data as needed
        console.log('Received University Data:', universityData);

        // Insert data into the MongoDB collection
        const result = await temporaryinfoCollection.insertOne(universityData);

        // Send the result back to the frontend
        res.status(200).json({ message: 'Data received and inserted successfully.', result });
      } catch (error) {
        console.error('Error during insertion:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.get('/temporaryinfo', async (req, res) => {
      try {
        const data = await temporaryinfoCollection.find().toArray();
        console.log(data);
        res.json(data);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve temporary info' });
      }
    });

    app.delete('/temporaryinfo/:id', async (req, res) => {
      const id = req.params.id;

      try {
        const result = await temporaryinfoCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 1) {
          res.status(200).json({ message: 'Data deleted successfully.' });
        } else {
          res.status(404).json({ error: 'Data not found.' });
        }
      } catch (error) {
        console.error('Error during deletion:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
    app.post('/users', async (req, res) => {
      const user = req.body;
      console.log(user)
      const result = await userCollection.insertOne(user)
      res.send(result);
    })
    app.get('/users', async (req, res) => {
      try {
        const query = {};
        const users = await userCollection.find(query).toArray();
        console.log(users);
        res.send(users);
      } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Internal Server Error');
      }
    });
    

    app.get('/users/:email', async (req, res) => {
      try {
        const userEmail = req.params.email;
        const query = { email: userEmail };
        const user = await userCollection.findOne(query);
    
        if (user) {
          res.json({ role: user.role });
        } else {
          res.status(404).json({ error: 'User not found' });
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    app.patch('/users/:id', async (req, res) => {
      const userId = req.params.id;

      try {
        const result = await userCollection.updateOne(
          { _id: new ObjectId(userId) },
          { $set: { role: 'admin' } }
        );

        if (result.modifiedCount === 1) {
          res.json({ message: 'User role updated to admin successfully' });
        } else {
          res.status(404).json({ error: 'User not found' });
        }
      } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
    app.delete('/users/:id', async (req, res) => {
      const userId = req.params.id;
    
      try {
        // Use new keyword when creating ObjectId instance
        const result = await userCollection.deleteOne({ _id: new ObjectId(userId) });
    
        if (result.deletedCount === 1) {
          res.json({ message: 'User deleted successfully' });
        } else {
          res.status(404).json({ error: 'User not found' });
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
    
   
  } finally {
  }
}

run().catch(console.log);


app.listen(port, () => {
  console.log(`server is running on PORT: ${port}`);
});
app.get('/', (req, res) => {
  res.send('Users Management server is running');
});