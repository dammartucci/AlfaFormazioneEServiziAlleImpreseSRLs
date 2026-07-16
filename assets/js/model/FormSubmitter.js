/*TO USE EMAIJS:
  1 create a new account or login
  2 go to email services > add a new service
  3 login to the specified email account via the popup dialog that spawns
  4 a form must be created or present on the desired webpage  
  5 go to email templates > create new email template, that is used to build, in this case, an automated reply to the sender that compiled the form.
    you are asked to create the email structure, where parameters in the double curly brackets are the name="" attribute for each entry in the form,
	that is fetched from it and copied as text. 
  6 now, fetch three parameters to insert them on the section below:
    go to account        > copy Public Key  
	go to email services > copy the current email address Service ID
	go to templates      > copy the current Template ID
*/

//EMAILJS SENDING PARAMETERS
const EMAIL      = "studiogpmar@gmail.com";
const PUBLIC_KEY = "HYklGfkcF7vt1I2Ym";
const SERVICEID  = "service_coa7n0s";
const CONTACTID  = "template_urufu16";

//MESSAGE COUNTER LIMITER PARAMETERS
const MESSAGES_PER_USER = 2;
const DAYS_TO_RESET     = 14; 
const SERVICE_NAME      = "anti-spam-counter";

//STATUS MESSAGES TEXT

const MESSAGE_SENDING_SUCCESS = "Grazie per averci contattato! Una risposta arriverà a breve sulla email da lei indicata.";

const ERROR_SCRIPT_NOT_LOADED = "Il caricamento della libreria emailjs è fallito";

const ERROR_MESSAGE_LIMIT_EXCEEDED = 
    "A causa della limitatezza di risorse computazionali, non può inviare più di\n" + 
    `${MESSAGES_PER_USER} messaggi in ${DAYS_TO_RESET} giorni. Attenda una risposta\n` + 
	"da parte dello staff, e avvii così una conversazione.";
	
const ERROR_MESSAGE_NOT_SENT = 
    "Attenzione! Si è verificato un problema con il servizio di invio messaggi.\n" +
	"Alla chiusura di questa allerta, in fondo al Suo messaggio, verranno aggiunte le istruzioni su come procedere ulteriormente.";

const ERROR_MESSAGE_NOT_SENT_TROUBLESHOOTING = 
    "\n\nIstruzioni: Copi tutto quel che è contenuto in questo messaggio, incluso tale testo autogenerato\n" +
    "A seguito di un problema tecnico, è necessario che Lei invii manualmente un'email con le seguenti informazioni:\n"+
    `Indirizzo e-mail del destinatario: ${EMAIL}\n` + 
    `Oggetto dell'email: Richiesta di contatto manuale, a causa di un problema tecnico\n\n` +
    "Questo invece è ciò su cui dobbiamo lavorare noi: ERRORE ";


class FormSubmitter{	
	constructor(textform){		
		this.textform = textform;
	    this.session  = this.#loadSession();
	}
	
	#loadSession(){
		let session = JSON.parse(localStorage.getItem(SERVICE_NAME));
		let now     = Date.now();
		
		if(!session || now > session.expiry){
			session = {
				id: "sess-" + Math.random().toString(36).substring(2) + now,
				sentCounter: 0,
				expiry: now + DAYS_TO_RESET * 1000 * 60 * 60 * 24,   //convert days to milliseconds				
			};
			localStorage.setItem(SERVICE_NAME,JSON.stringify(session));
		}
		return session;
	}
	
	#loadEmailjs(){
		if(window.emailjs)
		    return Promise.resolve(window.emailjs);
		
		return new Promise((resolve, reject) => {
		    let jscript = document.createElement("script");
			
			jscript.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
			jscript.type = "text/javascript";
			
			jscript.onerror = (event) => {
				reject(new Error(ERROR_SCRIPT_NOT_LOADED))
			}
			jscript.onload  = () => {
				emailjs.init({
		            publicKey: PUBLIC_KEY,	
		        });
				resolve(window.emailjs);
			}
			document.head.appendChild(jscript);
		});
	}
	
	async submit(){	
	    if(this.session.sentCounter >= MESSAGES_PER_USER)
			return ERROR_MESSAGE_LIMIT_EXCEEDED;
        else try{
			let emailjs  = await this.#loadEmailjs();
			let response = await emailjs.sendForm(SERVICEID,CONTACTID,this.textform);	
			if(response.status === 200){
				this.session.sentCounter++;
			    return [MESSAGE_SENDING_SUCCESS];	
			}
		}catch(error){
		    return [ERROR_MESSAGE_NOT_SENT, ERROR_MESSAGE_NOT_SENT_TROUBLESHOOTING + `${error.status} - ${error.text}`];
		}
	}
}