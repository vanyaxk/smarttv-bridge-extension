export function generateRandomDeviceName(): string {
    const adjectives = [
        'Smart', 'Living', 'Family', 'Media', 'Home', 'Cozy', 'Digital',
        'Main', 'Entertainment', 'Crystal', 'Ultra', 'Premium', 'Modern'
    ];
    
    // Characters for the random code
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const allChars = letters + numbers;
    
    // First, generate a completely random 6-char code
    let codeChars = [];
    for (let i = 0; i < 6; i++) {
        codeChars.push(allChars.charAt(Math.floor(Math.random() * allChars.length)));
    }
    
    // Count how many numbers we got
    const numCount = codeChars.filter(char => numbers.includes(char)).length;
    
    // If we don't have at least 2 numbers, replace random letters with numbers
    if (numCount < 2) {
        // Find positions that have letters
        const letterPositions = codeChars
            .map((char, index) => numbers.includes(char) ? -1 : index)
            .filter(pos => pos !== -1);
            
        // Determine how many more numbers we need
        const numbersNeeded = 2 - numCount;
        
        // Replace random letters with numbers
        for (let i = 0; i < numbersNeeded; i++) {
            const randomIndex = Math.floor(Math.random() * letterPositions.length);
            const positionToReplace = letterPositions[randomIndex];
            
            // Replace with a random number
            codeChars[positionToReplace] = numbers.charAt(Math.floor(Math.random() * numbers.length));
            
            // Remove this position from available positions
            letterPositions.splice(randomIndex, 1);
        }
    }
    
    // Create the final code with a hash at the start
    const randomCode = '#' + codeChars.join('');
    
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    
    return `${randomAdjective}${randomCode}`;
}