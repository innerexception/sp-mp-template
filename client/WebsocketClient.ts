import { ApiUrl } from '../enum'

export default class WebsocketClient {

    websocket: ReconnectingWebSocket

    constructor(){
        console.log('ws: connecting');
        this.websocket = new ReconnectingWebSocket(ApiUrl)
    }

    setListeners = (onWSMessage, onConnected, onConnectionError) => {
      const boot = !this.websocket.onmessage
      this.websocket.onopen = onConnected
      this.websocket.onerror = onConnectionError
      this.websocket.onmessage = (e:any) => {
          if(e){
            var data = JSON.parse(e.data);
            onWSMessage(data);
          }
      }
      if(boot) this.websocket.connect(false);
    }

    disconnect = () => {
        this.websocket.close()
    }

    publishMessage= (msg:ServerMessage) => {
      var message = JSON.stringify(msg)
      if(message) {
          this.websocket.send(message);
      }
    }
};

class ReconnectingWebSocket {

  // These can be altered by calling code.
  debug = false;
  reconnectInterval = 2000;
  timeoutInterval = 5000;
  url = ''
  ws:WebSocket;
  forcedClose = false;
  timedOut = false;
  protocols = [];
  readyState = WebSocket.CONNECTING;

  constructor(url){
    this.url = url;
  }
  
  onopen = null

  onclose = (event:any) => {};

  onconnecting = (event?:any) => {};

  onmessage = null

  onerror = null

  connect = (reconnectAttempt:boolean) => {

    this.ws = new WebSocket(this.url);
    this.onconnecting();

    var timeout = setTimeout(() => {
      this.timedOut = true;
      this.ws.close();
      this.timedOut = false;
    }, this.timeoutInterval);

    this.ws.onopen = (event:any) => {
      clearTimeout(timeout);
      this.readyState = WebSocket.OPEN;
      reconnectAttempt = false;
      this.onopen(event);
    };

    this.ws.onclose = (event:any) => {
      clearTimeout(timeout);
      this.ws = null;
      if (this.forcedClose) {
        this.readyState = WebSocket.CLOSED;
        this.onclose(event);
      } else {
        this.readyState = WebSocket.CONNECTING;
        this.onconnecting();
        if (!reconnectAttempt && !this.timedOut) {
          this.onclose(event);
        }

        setTimeout(()=>{
          this.connect(true);
        }, this.reconnectInterval);
      }
    };

    this.ws.onmessage = (event:any) => {
      this.onmessage(event);
    };

    this.ws.onerror = (event:any) => {
      this.onerror(event);
    };
  }

  send = (data:any) => {
    if (this.ws) {
      return this.ws.send(data);
    } else {
      throw 'INVALID_STATE_ERR : Pausing to reconnect websocket';
    }
  };

  close = () => {
    this.forcedClose = true;
    if (this.ws) {
      this.ws.close();
    }
  };

  /**
   * Additional public API method to refresh the connection if still open (close, re-open).
   * For example, if the app suspects bad data / missed heart beats, it can try to refresh.
   */

  refresh = () => {
    if (this.ws) {
      this.ws.close();
    }
  };
}