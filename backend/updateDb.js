fetch('http://localhost:5000/api/segments').then(r => r.json()).then(async segs => {
  let updated = 0;
  for (const seg of segs) {
    if ((seg.count === 0 || seg.count === undefined) && seg.afterWin === 'disable') {
      console.log('Updating', seg.label, 'to random');
      await fetch('http://localhost:5000/api/admin/segments/bulk-counts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segmentLimits: { [seg._id]: { count: 0, afterWin: 'random' } } })
      });
      updated++;
    }
  }
  console.log('Updated', updated, 'segments');
});
