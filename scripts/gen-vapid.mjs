import webpush from 'web-push'

const keys = webpush.generateVAPIDKeys()
console.log('Genera las claves VAPID para los recordatorios\n')
console.log('Pega esto en tu archivo .env (o déjalas para que el server las guarde solo):\n')
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`)
console.log('VAPID_SUBJECT=mailto:tatty@bodoque.app')
