/**
 * Test Document Generator
 * Run this script in browser console to create test PDF documents
 */

// Simple PDF generator using jsPDF (already installed in your project)
function createTestDocuments() {
    const { jsPDF } = window.jspdf;
    
    const docs = [
        {
            filename: 'cnss_card.pdf',
            title: 'CNSS Card',
            content: [
                'CAISSE NATIONALE DE SÉCURITÉ SOCIALE',
                'Carte d\'Immatriculation',
                '',
                'Nom: TEST USER',
                'Numéro: 1234567890123',
                'Valide jusqu\'au: 31/12/2025',
                '',
                'This is a test document for Flowly HR System'
            ]
        },
        {
            filename: 'cin_card.pdf', 
            title: 'National ID Card',
            content: [
                'ROYAUME DU MAROC',
                'Carte Nationale d\'Identité Électronique',
                '',
                'Nom: TEST',
                'Prénom: USER',
                'Date de naissance: 01/01/1990',
                'Lieu de naissance: CASABLANCA',
                'CIN: AB123456',
                '',
                'This is a test document for Flowly HR System'
            ]
        },
        {
            filename: 'diploma_certificate.pdf',
            title: 'Diploma Certificate', 
            content: [
                'UNIVERSITÉ TEST',
                'DIPLOME DE LICENCE',
                '',
                'Spécialité: INFORMATIQUE',
                'Conféré à: TEST USER',
                'Session: JUIN 2024',
                'Mention: BIEN',
                '',
                'This is a test document for Flowly HR System'
            ]
        },
        {
            filename: 'bank_rib.pdf',
            title: 'Bank RIB Statement',
            content: [
                'RELEVÉ D\'IDENTITÉ BANCAIRE',
                '',
                'Banque: BANQUE TEST',
                'Agence: CASABLANCA CENTRE',
                'Compte: 12345678901234567890',
                'Clé: 18',
                'IBAN: MA000000000000000000000000',
                'Titulaire: TEST USER',
                '',
                'This is a test document for Flowly HR System'
            ]
        }
    ];
    
    docs.forEach(doc => {
        const pdf = new jsPDF();
        
        // Add header
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(doc.title, 20, 20);
        
        // Add content
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        let y = 40;
        doc.content.forEach(line => {
            pdf.text(line, 20, y);
            y += 10;
        });
        
        // Add footer
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'italic');
        pdf.text('Generated for Flowly HR System Testing', 20, 270);
        pdf.text(`Created: ${new Date().toLocaleString()}`, 20, 275);
        
        // Save the PDF
        pdf.save(doc.filename);
    });
    
    console.log('Test documents created successfully!');
    console.log('Files downloaded:');
    docs.forEach(doc => console.log(`- ${doc.filename}`));
}

// Auto-generate when script is loaded
if (typeof window !== 'undefined') {
    // Create a button to generate docs
    const button = document.createElement('button');
    button.textContent = 'Generate Test Documents';
    button.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        background: #6366f1;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
    `;
    button.onclick = createTestDocuments;
    document.body.appendChild(button);
    
    console.log('Test document generator ready!');
    console.log('Click the "Generate Test Documents" button in the top-right corner');
}

// Export for manual use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createTestDocuments };
}
