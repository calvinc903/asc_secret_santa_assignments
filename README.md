# To Do
- [x] Allow upload videos on website
- [x] Santa's Page (displays a list of "cards" for each user)
- [x] Create signup and login page
- [x] Design accounts system probably need sessions
- [x] Block submission unless data is found in MongoDB
- [x] Automatically lowercase names on submission

# Known Bugs
- [ ] On safari the animation starts like 3 seconds in... need to figure out why this is the case.

# Extra Features

- [ ] Confetti effect when retrieving a person

# LongTerm
- [ ] Change assignments to use id instead of name. Will need to update all pages that reference Assignments API after this update. (Submit Video and get Giftee)
- [ ] embed spreadsheet into website or even just replace the spreadsheet as a whole


# Deploy worker
npx wrangler deploy 'video-worker'
