# LearnLink Step 1: secure accounts (setup and testing guide)

## What changed
- Login now needs a real, correct password through Firebase. The old "any 4 characters" admin passcode and the demo logins are gone.
- All sample tutors, bookings, chats, reviews and fake stats are removed. The site starts empty.
- Roles are controlled by the database, not the browser. New accounts can only be a student, or a tutor who waits for approval. Nobody can approve themselves.
- Tutors' public cards (`tutors`) are separate from private profiles (`users`: email, phone, documents). Only the owner and admins can open private profiles.
- Admins are listed in a protected `admins` collection that only you can edit in the Firebase console.
- "Forgot password" now really sends a reset email.
- New file `firestore.rules` holds the access rules.

## Not tested
I could not run the site where I work, so none of this has been tested live. Test on a separate branch first (Part A) and use the checklist (Part E).

## Part A: put the code on a test branch
1. Unzip the download on your computer.
2. In GitHub, open the repo `New-LearnLink`, click the branch button (says `main`), type `step1-security`, and choose "Create branch".
3. On that branch, click Add file, then Upload files. Drag in everything inside the unzipped folder (including the `src` folder) and commit to the `step1-security` branch.
4. Vercel will build a private preview link for that branch (see the Deployments tab in Vercel). Use that link for testing.

## Part B: Firebase settings (console.firebase.google.com)
1. Build, then Authentication, then Sign-in method: make sure **Email/Password** and **Google** are both enabled.
2. Authentication, then Settings, then Authorized domains: add `learnlink.ink`, `www.learnlink.ink`, and your Vercel preview address (without https://).

## Part C: create your admin account
1. Authentication, then Users, then Add user. Use your email and a strong password you do not use anywhere else.
2. Copy that user's **User UID** (the long code in the table).
3. Build, then Firestore Database, then Start collection. Name it `admins`.
4. Document ID: paste the UID. Add one field: name `role`, type string, value `admin`. Save.

## Part D: publish the access rules
1. Firestore Database, then the Rules tab.
2. Replace everything with the contents of `firestore.rules`, then press Publish.
3. Rules apply to the whole Firebase project, so they also apply to the current live site. It already cannot save to Firestore, so nothing gets worse, but do this just before you test.

## Part E: test checklist (on the preview link)
1. Home page loads and says "Tutors joining soon" (no fake tutors).
2. Go to the admin page (`/#admin`). Try any 4-character passcode: it must be refused.
3. Sign in there with your admin email and password: the dashboard opens.
4. Register a student with another email. A verification email arrives. After confirming, you can log in.
5. Register a tutor with a third email. You get the "pending approval" message and cannot log in yet.
6. In the admin portal, approve the tutor. Open the site in a private window (not logged in): the tutor now shows on the home page and the directory.
7. Log in as that tutor.
8. In the admin portal, suspend the tutor: the card disappears and they cannot log in.
9. "Forgot password": the reset email arrives.
10. In the Firebase console, check that `users` and `tutors` documents appeared.

If a step fails, press F12, open Console, and copy the red message. Send it to me with the step number.

## Part F: go live
When every step passes, merge the `step1-security` branch into `main` on GitHub. Vercel then updates learnlink.ink.
People who registered on the old site have Firebase logins but no saved profile. They should choose Join LearnLink and register again with the same email and password.

## Still to do (next steps)
- Bookings, chats, reviews and payments are still stored only in each person's own browser. They move to the database in the next step.
- The escrow and payment screens are still simulated and still say your payments are held. Do not let real students pay through them. Rewording comes next.
- Tutor "documents" are only file names, not uploaded files, so an admin cannot really review them yet.
- Duplicate phone numbers cannot be checked yet.
- The booking calendar shows fixed placeholder dates.
- Free-period setting and better ranking are not added yet.
