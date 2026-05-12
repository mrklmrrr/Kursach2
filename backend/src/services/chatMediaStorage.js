const mongoose = require('mongoose');

const BUCKET_NAME = 'chat_attachments';

function getBucket() {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB is not connected');
  }
  return new mongoose.mongo.GridFSBucket(db, { bucketName: BUCKET_NAME });
}

/**
 * @param {Buffer} buffer
 * @param {string} filename
 * @param {{ consultationId: string, mimeType: string, fileName: string }} metadata
 * @returns {Promise<mongoose.Types.ObjectId>}
 */
function uploadChatFile(buffer, filename, metadata) {
  return new Promise((resolve, reject) => {
    const bucket = getBucket();
    const uploadStream = bucket.openUploadStream(filename, { metadata });
    uploadStream.on('error', reject);
    uploadStream.on('finish', () => resolve(uploadStream.id));
    uploadStream.end(buffer);
  });
}

async function findChatFileDoc(fileId) {
  const db = mongoose.connection.db;
  if (!db) return null;
  const coll = db.collection(`${BUCKET_NAME}.files`);
  try {
    return coll.findOne({ _id: new mongoose.Types.ObjectId(fileId) });
  } catch {
    return null;
  }
}

function pipeChatFileToResponse(fileId, res) {
  return new Promise((resolve, reject) => {
    const bucket = getBucket();
    let stream;
    try {
      stream = bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
    } catch (e) {
      return reject(e);
    }
    stream.on('error', reject);
    stream.on('end', resolve);
    stream.pipe(res);
  });
}

async function deleteChatFile(fileId) {
  try {
    const bucket = getBucket();
    await bucket.delete(new mongoose.Types.ObjectId(fileId));
  } catch {
    // ignore missing / race
  }
}

module.exports = {
  uploadChatFile,
  findChatFileDoc,
  pipeChatFileToResponse,
  deleteChatFile
};
