const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: process.env.PORT || 1234 });

const storeData = {
  luz: 0,
  humedad: 0,
  tempAire: 0,
  humedadAire: 0
}

wss.on('connection', function connection(ws) {
  ws.on('message', function message(data) {
    console.log('received: %s', data);
    handlerEventMessage(data.toString(), ws);
  });
  // Enviar la informacion previamente guardada
  ws.send(`client-web~set-data~${storeData.luz}|${storeData.humedad}|${storeData.tempAire}|${storeData.humedadAire}`);
});

function handlerEventMessage(payload, ws) {
  const [origin, key, data] = payload.split('~');

  switch (key) {
    case 'set-data': // origin -> microcontroller, example: 'microcontroller~set-data~10|20|30|40'
      const [luz, humedad, tempAire, humedadAire] = data.split('|');
      // Guardar la informacion
      storeData.luz = luz;
      storeData.humedad = humedad;
      storeData.tempAire = tempAire;
      storeData.humedadAire = humedadAire;
      // Enviar la informacion a todos los clientes web
      wss.clients.forEach(client => client.send(
        `client-web~set-data~${storeData.luz}|${storeData.humedad}|${storeData.tempAire}|${storeData.humedadAire}`
      ))
      break;
    case 'set-action': // origin -> client-web, example: 'client-web~set-action~luz'
      const action = data;
      // Enviar la accion a microcontroller
      wss.clients.forEach(client => client.send(
        `microcontroller~set-action~${action}`
      ));
      break;
  }
}