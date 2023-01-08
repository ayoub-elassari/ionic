import { Component, OnInit } from '@angular/core';
import { ContactAcessService } from '../services/contact-acess.service';
import { Compte } from '../models/Compte';
import { ContactAuthService } from '../services/contact-auth.service';
import { NavController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
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
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  image: string;
  compte: Compte;
  email: string;
  ngFireUploadTask: AngularFireUploadTask;
  progressSnapshot: Observable<any>;
  fileUploadedPath: Observable<string>;
  modified: boolean;
  currentPassword: any;
  profileInfo: Compte ;
  editProfileForm: any;

  constructor(
    private contactservice: ContactAcessService,
    private fireauth: ContactAuthService,
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private formBuilder: FormBuilder,

    private angularFireStorage: AngularFireStorage
  ) {
      this.editProfileForm = this.formBuilder.group({
        nom: [''],
        prenom: [''],
        email: [''],
        tel: [''],
      });
    }

  ngOnInit() {
    this.modified = true;
    this.fireauth.userDetails().subscribe(
      (res) => {
        console.log('res', res);
        if (res !== null) {
          this.email = res.email;
          console.log('email: ', this.email);
          this.contactservice.getCompte(this.email).subscribe((result) => {
            this.compte = result as Compte;
            console.log('dd', res);
          });
          const fileStoragePath = `Compte/${this.email}/profileImage`;
          const imageRef = this.angularFireStorage.ref(fileStoragePath);
          this.fileUploadedPath = imageRef.getDownloadURL();
        } else {
          this.navCtrl.navigateForward('/authentification');
        }
      },
      (err) => {
        console.log('err', err);
      }
    );
    setTimeout(() => {
      console.log(this.contactservice.getCompte(this.email).subscribe(res => {
        this.compte = res as Compte;
        this.currentPassword = this.compte.password;
        console.log('this.currentPassword : ' + this.currentPassword);
        console.log('compte => ' +res);
      }));
    }, 2000);
    //console.log();
  }
  fileUpload(event: FileList) {
    const file = event.item(0);
    if (file.type.split('/')[0] !== 'image') {
      console.log('File type is not supported!');
      return;
    }
    const fileStoragePath = `Compte/${this.email}/profileImage`;
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
  modifier() {
    this.modified = false;
  }
  async updateProfile(){
     this.profileInfo = {
      nom: this.editProfileForm.get('nom')?.value,
      password: this.currentPassword,
      prenom: this.editProfileForm.get('prenom')?.value,
      email: this.editProfileForm.get('email')?.value,
      tel: this.editProfileForm.get('tel')?.value,
    };
    console.log('this.profileInfo => '+this.profileInfo);
    await this.contactservice.updateProfile(this.email,this.profileInfo);
    this.modified = true;
    this.navCtrl.navigateForward('/liste-contacts');
  }
}
