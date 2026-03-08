# Document Upload Testing Guide

## Test Documents Needed

Create these test documents to verify the document upload system works correctly:

### 1. CNSS Card (Required)
- **File**: `cnss_card_front.pdf` or `cnss_card.jpg`
- **Content**: Sample CNSS social security card (front side)
- **Size**: Under 10MB
- **Format**: PDF or JPG

### 2. National ID Card - CIN (Required)
- **File**: `cin_card.pdf` or `cin_id.jpg`
- **Content**: Sample Moroccan National ID card
- **Size**: Under 10MB
- **Format**: PDF or JPG

### 3. Diploma Certificate (Required)
- **File**: `diploma_certificate.pdf`
- **Content**: Sample university/college diploma
- **Size**: Under 10MB
- **Format**: PDF preferred

### 4. Bank RIB Statement (Required)
- **File**: `bank_rib.pdf`
- **Content**: Sample bank account details (RIB)
- **Size**: Under 10MB
- **Format**: PDF preferred

## Quick Test Document Generator

If you don't have these documents, you can create simple test PDFs:

### Method 1: Online PDF Generator
1. Go to https://www.pdf24.org/create-pdf
2. Create simple PDFs with:
   - Title matching the document type
   - Some sample text
   - Save as different file names

### Method 2: Use Existing Documents
- Any PDF file with different names
- Rename them to match required types
- Ensure they're under 10MB

## Test Scenarios

### Scenario 1: Complete Onboarding Flow
1. Upload all 4 required documents
2. Verify each shows "Uploaded" status
3. Click "Submit All Documents"
4. Verify status changes to "Submitted"

### Scenario 2: Document Preview
1. Upload a document
2. Click "Preview" button
3. Verify document opens in modal
4. Test download functionality

### Scenario 3: Document Replacement
1. Upload a document
2. Have HR reject it (if HR access available)
3. Verify "Rejected" status appears
4. Re-upload the same document
5. Verify replacement works

### Scenario 4: Error Handling
1. Try uploading a file > 10MB
2. Try uploading an unsupported file type
3. Verify appropriate error messages

## File Naming Convention

Test files should follow this pattern:
- `cnss_test_document.pdf`
- `cin_sample_id.jpg`
- `diploma_certificate.pdf`
- `bank_rib_statement.pdf`

## Sample Test Data

For quick testing, you can create simple text files and convert to PDF:

### CNSS Card Content:
```
CNSS - Caisse Nationale de Sécurité Sociale
Carte d'Immatriculation
Nom: TEST USER
Numéro: 1234567890123
Valide jusqu'au: 31/12/2025
```

### CIN Card Content:
```
ROYAUME DU MAROC
Carte Nationale d'Identité Électronique
Nom: TEST
Prénom: USER
Date de naissance: 01/01/1990
Lieu de naissance: CASABLANCA
CIN: AB123456
```

### Diploma Content:
```
UNIVERSITÉ TEST
DIPLOME DE LICENCE
Spécialité: INFORMATIQUE
Conféré à: TEST USER
Session: JUIN 2024
```

### RIB Content:
```
RELEVÉ D'IDENTITÉ BANCAIRE
Banque: BANQUE TEST
Agence: CASABLANCA CENTRE
Compte: 12345678901234567890
Clé: 18
IBAN: MA000000000000000000000000
Titulaire: TEST USER
```

## Testing Checklist

- [ ] Upload each document type successfully
- [ ] Preview functionality works
- [ ] Submit all documents works
- [ ] Error messages display correctly
- [ ] File size validation works
- [ ] File type validation works
- [ ] Document deletion works
- [ ] Status updates correctly

## Notes

- Maximum file size: 10MB
- Supported formats: PDF, JPG, JPEG, PNG
- All 4 documents are required for submission
- Documents can be replaced if rejected
