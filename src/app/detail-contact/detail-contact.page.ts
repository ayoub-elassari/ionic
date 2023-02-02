/* eslint-disable prefer-arrow/prefer-arrow-functions */
import { Component, OnInit } from '@angular/core';
import { Contact } from '../models/Contact';
import { ContactAcessService } from '../services/contact-acess.service';
import { ContactAuthService } from '../services/contact-auth.service';
import { NavController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { CallNumber } from '@ionic-native/call-number/ngx';
import { EmailComposer } from '@ionic-native/email-composer/ngx';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { SMS } from '@ionic-native/sms/ngx';
import { SocialSharing } from '@ionic-native/social-sharing/ngx';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  AngularFireStorage,
  AngularFireUploadTask,
} from '@angular/fire/compat/storage';
import {
  AngularFirestore,
  AngularFirestoreCollection,
} from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';

@Component({
  selector: 'app-detail-contact',
  templateUrl: './detail-contact.page.html',
  styleUrls: ['./detail-contact.page.scss'],
})
export class DetailContactPage implements OnInit {
  emailContact: string;
  from: string;
  contact: Contact;
  isButtonsVisible = false;
  modified: boolean;
  inscriptionForm: FormGroup;
  ngFireUploadTask: AngularFireUploadTask;
  progressSnapshot: Observable<any>;
  fileUploadedPath: Observable<string>;
  locationUrl: any;

  constructor(
    private contactservice: ContactAcessService,
    private fireauth: ContactAuthService,
    private firestore: ContactAcessService,
    private navCtrl: NavController,
    private route: ActivatedRoute,
    private callNumber: CallNumber,
    private emailComposer: EmailComposer,
    private geolocation: Geolocation,
    private router: Router,
    private sms: SMS,
    private socialSharing: SocialSharing,
    private angularFireStorage: AngularFireStorage,
    private formBuilder: FormBuilder
  ) {
    this.route.queryParams.subscribe((params) => {
      this.emailContact = params.emailContact;
      this.from = params.from;
      if (this.from === 'liste-contacts-rec') {
        this.isButtonsVisible = false;
      } else {
        this.isButtonsVisible = true;
      }
    });
  }

  ngOnInit() {
    if (this.from === 'liste-contacts-rec') {
      this.recommande();
    } else {
      this.personel();
      this.modified = true;
    }
    const fileStoragePath = `Contact/${this.emailContact}/profileImage`;
    const imageRef = this.angularFireStorage.ref(fileStoragePath);
    this.fileUploadedPath = imageRef.getDownloadURL();
  }

  personel() {
    this.fireauth.userDetails().subscribe(
      (res) => {
        console.log('res', res);
        if (res !== null) {
          // eslint-disable-next-line @typescript-eslint/no-shadow
          this.contactservice
            .getPersonalContact(res.email, this.emailContact)
            // eslint-disable-next-line @typescript-eslint/no-shadow
            .subscribe((res) => {
              this.contact = res as Contact;
              console.log(res);
            });
        } else {
          this.navCtrl.navigateForward('/authentification');
        }
      },
      (err) => {
        console.log('err', err);
      }
    );
  }

  recommande() {
    this.fireauth.userDetails().subscribe(
      (res) => {
        console.log('res', res);
        if (res !== null) {
          this.contactservice.getContact(this.emailContact).subscribe(
            // eslint-disable-next-line @typescript-eslint/no-shadow
            (res) => {
              this.contact = res as Contact;
              console.log(res);
            }
          );
        } else {
          this.navCtrl.navigateForward('/authentification');
        }
      },
      (err) => {
        console.log('err', err);
      }
    );
  }

  modifier() {
    this.modified = false;
  }
  supprimer() {
    this.fireauth.userDetails().subscribe(
      (res) => {
        console.log('res', res);
        if (res !== null) {
          this.contactservice.delateContactPersonel(
            res.email,
            this.contact.email
          );
          this.navCtrl.navigateForward('/liste-contacts');
        } else {
          this.navCtrl.navigateForward('/authentification');
        }
      },
      (err) => {
        console.log('err', err);
      }
    );
  }

  partager() {
    this.fireauth.userDetails().subscribe(
      (res) => {
        console.log('res', res);
        if (res !== null) {
          this.firestore.newContact(this.contact);
          this.navCtrl.navigateForward('/recommended-contacts');
        } else {
          this.navCtrl.navigateForward('/authentification');
        }
      },
      (err) => {
        console.log('err', err);
      }
    );
  }

  appel() {
    this.callNumber
      .callNumber(this.contact.tel, true)
      .then((res) => console.log('Launched dialer!', res))
      .catch((err) => console.log('Error launching dialer', err));
  }

  email() {
    const mytext = prompt('Ecrivez votre message');
    const email = {
      to: this.contact.email,
      subject: 'Demmand de service : ' + this.contact.service,
      body: mytext,
      isHtml: true,
    };
    this.emailComposer.open(email);
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  GPS(): void {
    //      this.geolocation.getCurrentPosition().then((resp) => {
    //       const localisationCoordinates =  resp.coords.latitude.toString() + ',' + resp.coords.longitude.toString();
    //       //
    //       this.socialSharing.shareViaWhatsAppToReceiver(this.contact.tel,
    //         'Ma localisation est  \n  ' +  'https://www.google.com/maps/@'+localisationCoordinates, null).then(() => {
    // // Success!
    //       }).catch(() => {
    // // Error!
    //       });
    //       console.log(this.locationUrl);
    //     }).catch((error) => {
    //       console.log('Error getting location', error);
    //     });
    //     return '';
  }

  sendSMS() {
    this.sms.send(this.contact.tel, 'Bonjour, je suis ayoub', {
      replaceLineBreaks: false, // true to replace \n by a new line, false by default
      android: {
        intent: 'INTENT', // send SMS with the native android SMS messaging
        //intent: '' // send SMS without opening any other app
      },
    });
  }

  sharing() {
    this.geolocation
      .getCurrentPosition()
      .then((resp) => {
        const localisationCoordinates =
          resp.coords.latitude.toString() +
          ',' +
          resp.coords.longitude.toString();
        //
        this.socialSharing
          .shareViaWhatsAppToReceiver(
            this.contact.tel,
            'Ma localisation est  \n  ' +
              'https://www.google.com/maps/@' +
              localisationCoordinates,
            null
          )
          .then(() => {
            // Success!
          })
          .catch(() => {
            // Error!
          });
        console.log(this.locationUrl);
      })
      .catch((error) => {
        console.log('Error getting location', error);
      });
  }

  fileUpload(event: FileList) {
    const file = event.item(0);
    if (file.type.split('/')[0] !== 'image') {
      console.log('File type is not supported!');
      return;
    }
    const fileStoragePath = `Contact/${this.emailContact}/profileImage`;
    const imageRef = this.angularFireStorage.ref(fileStoragePath);
    this.ngFireUploadTask = this.angularFireStorage.upload(
      fileStoragePath,
      file
    );
    this.progressSnapshot = this.ngFireUploadTask.snapshotChanges().pipe(
      finalize(() => {
        this.fileUploadedPath = imageRef.getDownloadURL();
      })
    );
  }

  save() {
    this.fireauth.userDetails().subscribe(
      (res) => {
        console.log('res', res);
        if (res !== null) {
          // eslint-disable-next-line @typescript-eslint/no-shadow
          this.contactservice.setPersonalContact(
            res.email,
            this.emailContact,
            this.contact
          );

          this.navCtrl.navigateForward('/liste-contacts');
        } else {
          this.navCtrl.navigateForward('/authentification');
        }
      },
      (err) => {
        console.log('err', err);
      }
    );
    console.log(this.contact);
  }
}
