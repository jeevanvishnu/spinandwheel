const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://jeevanvishnu18_db_user:UAltNSBrguVQZBQE@cluster0.he2xw9i.mongodb.net/?appName=Cluster0').then(async () => {
  const Segment = mongoose.model('Segment', new mongoose.Schema({ label: String, count: Number, afterWin: String }));
  const segs = await Segment.find();
  console.log(JSON.stringify(segs, null, 2));
  process.exit();
});
