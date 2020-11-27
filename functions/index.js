const functions = require('firebase-functions');

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');
admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Take the text parameter passed to this HTTP endpoint and insert it into
// Cloud Firestore under the path /messages/:documentId/original
exports.addMessage = functions.https.onRequest(async (req, res) => {
  // Grab the text parameter.
  const original = req.query.text;
  // Push the new message into Cloud Firestore using the Firebase Admin SDK.
  const writeResult = await admin.firestore().collection('messages').add({original: original});
  // Send back a message that we've succesfully written the message
  res.json({result: `Message with ID: ${writeResult.id} added.`});
});

exports.makeUppercase = functions.firestore.document('/messages/{documentId}')
	.onCreate((snap, context) => {
		// Grab the current value of what was written to Cloud Firestore.
		const original = snap.data().original;

		// Access the parameter `{documentId}` with `context.params`
		functions.logger.log('Uppercasing', context.params.documentId, original);

		const uppercase = original.toUpperCase();

		// You must return a Promise when performing asynchronous tasks inside a Functions such as
		// writing to Cloud Firestore.
		// Setting an 'uppercase' field in Cloud Firestore document returns a Promise.
		return snap.ref.set({uppercase}, {merge: true});
	});

// This function writes a TODO item
exports.createItem = functions.https.onRequest(async (req, res) => {
	const body = JSON.parse(req.body)
	const text = body.title;

	const writeItem = await admin.firestore().collection('todo-items').add({
		text: text,
		createdAt: admin.firestore.Timestamp.now(),
		checked: false,
		deletedAt: null
	});

	res.json({result: `Item with ID: ${writeItem.id} added.`})
});

// This function updates the text property on a TODO item
exports.editItem = functions.https.onRequest(async (req, res) => {
	const body = JSON.parse(req.body)
	const text = body.title;
	const docId = body.id;

	const docRef = admin.firestore().collection('todo-items').doc(docId);

	const updateResponse = await docRef.update({
		text: text
	})

	res.json({result: updateResponse, errors: null});
});

// This functions updates the checked property on a TODO item
exports.checkItem = functions.https.onRequest(async (req, res) => {

	const body = JSON.parse(req.body)

	const docId = body.id;

	const docRef = admin.firestore().collection('todo-items').doc(docId);

	const getDoc = await docRef.get()
		.then(doc => {
			if(!doc.exists) {
				functions.logger.error('No such document');
			} else {
				return doc.data();
			}
		})
		.catch(err => {
			functions.logger.error('Error getting document', err);
		})

	const updateResponse = await docRef.update({
		checked: !getDoc.checked
	});

	res.json({result: updateResponse, errors: null})
});

// This function deletes a TODO item (Soft Delete)
exports.deleteItem = functions.https.onRequest(async (req, res) => {

	const body = JSON.parse(req.body)

	const docId = body.id;

	const docRef = admin.firestore().collection('todo-items').doc(docId);

	const updateResponse = await docRef.update({
		deletedAt: admin.firestore.Timestamp.now()
	})

	res.json({result: updateResponse, errors: null});
});