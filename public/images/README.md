# Images – where to upload your photos

All paths are inside `public/images/`. Use **JPG**, landscape (4:3 or 3:2), about **1600×1200**, under 400 KB each.
If a file is missing the site shows a green placeholder, so you can upload them one by one and test.

## 1. Hero video (home page)
`public/videos/hero.mp4` – muted loop, 16:9, ideally under 8 MB. If the file is missing the site falls back to the AI clip URL in `src/lib/media.ts`, then to the photo slideshow.

## 2. Hero slideshow (already from Figma)
`hero-buildings.jpg` and `properties/*.jpg` (5 original Figma photos).

## 3. Auction photos – `public/images/auctions/`
Each auction needs 3 photos: `-1` is the card photo and first gallery image, `-2` and `-3` are the other gallery views.
The 5 original Figma photos are already placed as the `-1` of A1021, A1024, A1029, A1037 and A1045.

| ID | Type | Place | Files to upload |
|---|---|---|---|
| A1021 | Residential Property | Abdoun, Amman West | A1021-1.jpg, A1021-2.jpg, A1021-3.jpg |
| A1022 | Residential Apartment | University Street, Irbid | A1022-1.jpg, A1022-2.jpg, A1022-3.jpg |
| A1023 | Residential Building | Naur, Amman East | A1023-1.jpg, A1023-2.jpg, A1023-3.jpg |
| A1024 | Vacant Residential Land Plot | South Beach, Aqaba | A1024-1.jpg, A1024-2.jpg, A1024-3.jpg |
| A1025 | Commercial Complex | Russeifa, Zarqa | A1025-1.jpg, A1025-2.jpg, A1025-3.jpg |
| A1026 | Vacant Commercial Land Plot | Naur, Amman East | A1026-1.jpg, A1026-2.jpg, A1026-3.jpg |
| A1027 | Industrial Land Plot | Tala Bay, Aqaba | A1027-1.jpg, A1027-2.jpg, A1027-3.jpg |
| A1028 | Factory | New Zarqa, Zarqa | A1028-1.jpg, A1028-2.jpg, A1028-3.jpg |
| A1029 | Residential Property | Abdoun, Amman West | A1029-1.jpg, A1029-2.jpg, A1029-3.jpg |
| A1030 | Residential Apartment | University Street, Irbid | A1030-1.jpg, A1030-2.jpg, A1030-3.jpg |
| A1031 | Residential Building | Russeifa, Zarqa | A1031-1.jpg, A1031-2.jpg, A1031-3.jpg |
| A1032 | Vacant Residential Land Plot | Sweifieh, Amman West | A1032-1.jpg, A1032-2.jpg, A1032-3.jpg |
| A1033 | Commercial Complex | Al-Hasan, Irbid | A1033-1.jpg, A1033-2.jpg, A1033-3.jpg |
| A1034 | Vacant Commercial Land Plot | Hay Nazzal, Amman East | A1034-1.jpg, A1034-2.jpg, A1034-3.jpg |
| A1035 | Industrial Land Plot | Tala Bay, Aqaba | A1035-1.jpg, A1035-2.jpg, A1035-3.jpg |
| A1036 | Factory | University Street, Irbid | A1036-1.jpg, A1036-2.jpg, A1036-3.jpg |
| A1037 | Residential Property | Hay Nazzal, Amman East | A1037-1.jpg, A1037-2.jpg, A1037-3.jpg |
| A1038 | Residential Apartment | South Beach, Aqaba | A1038-1.jpg, A1038-2.jpg, A1038-3.jpg |
| A1039 | Residential Building | Russeifa, Zarqa | A1039-1.jpg, A1039-2.jpg, A1039-3.jpg |
| A1040 | Vacant Residential Land Plot | Sweifieh, Amman West | A1040-1.jpg, A1040-2.jpg, A1040-3.jpg |
| A1041 | Commercial Complex | Tala Bay, Aqaba | A1041-1.jpg, A1041-2.jpg, A1041-3.jpg |
| A1042 | Vacant Commercial Land Plot | New Zarqa, Zarqa | A1042-1.jpg, A1042-2.jpg, A1042-3.jpg |
| A1043 | Industrial Land Plot | Khalda, Amman West | A1043-1.jpg, A1043-2.jpg, A1043-3.jpg |
| A1044 | Factory | University Street, Irbid | A1044-1.jpg, A1044-2.jpg, A1044-3.jpg |
| A1045 | Residential Property | Marka, Amman East | A1045-1.jpg, A1045-2.jpg, A1045-3.jpg |
| A1046 | Residential Apartment | Dabouq, Amman West | A1046-1.jpg, A1046-2.jpg, A1046-3.jpg |
| A1047 | Residential Building | Al-Hasan, Irbid | A1047-1.jpg, A1047-2.jpg, A1047-3.jpg |
| A1048 | Vacant Residential Land Plot | Marka, Amman East | A1048-1.jpg, A1048-2.jpg, A1048-3.jpg |
| A1049 | Commercial Complex | Tala Bay, Aqaba | A1049-1.jpg, A1049-2.jpg, A1049-3.jpg |
| A1050 | Vacant Commercial Land Plot | New Zarqa, Zarqa | A1050-1.jpg, A1050-2.jpg, A1050-3.jpg |


## 4. Ads carousel – `public/images/ads/`
`ad-1.jpg` villas in Amman · `ad-2.jpg` land plots · `ad-3.jpg` live bidding · `ad-4.jpg` direct offers · `ad-5.jpg` list your property (about 1600×900).

## 5. Sign in / Sign up / app mock – `public/images/auth/`
`signin.jpg` and `signup.jpg` (portrait, about 1000×1300), `app.jpg` (small phone-screen photo, 600×400).

## 6. Logos
`logo.png`, `logo-footer.png` (already from Figma).

## Current state
Every slot above is pre-filled with a copy of one of the original Figma photos so nothing is empty.
To replace one, just upload your photo with the **same file name** — it overwrites the placeholder copy.


## Update
Placeholder copies were removed to keep the file count low (zip/upload limits). Any auction photo that is not uploaded now shows a shared stand-in from `properties/`. Upload real ones to `auctions/` with the same names (A1021-1.jpg ...).
