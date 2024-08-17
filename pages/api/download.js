const path = require('path');
const fs = require('fs');

module.exports = async function handler(req, res) {
  const { filename } = req.query;

  const filePath = path.join(process.cwd(), 'uploads', filename);
  
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/pdf');
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } else {
    res.status(404).json({ message: 'File not found' });
  }
};