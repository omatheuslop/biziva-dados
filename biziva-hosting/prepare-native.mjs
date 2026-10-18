import {cp,mkdir,rename} from 'node:fs/promises';
await mkdir(new URL('./public/',import.meta.url),{recursive:true});
await cp(new URL('../dist/',import.meta.url),new URL('./public/',import.meta.url),{recursive:true});
await rename(new URL('./public/index.html',import.meta.url),new URL('./public/native-index.html',import.meta.url));
