import fs from 'fs';
const envKeys = Object.keys(process.env).filter(k => k.toLowerCase().includes('firebase'));
console.log("Firebase env keys:", envKeys);
