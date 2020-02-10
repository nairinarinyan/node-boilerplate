import fs from 'fs';
import path from 'path';

export const readSecret = (fileName: string) => {
    const secretsPath = process.env.SECRETS_PATH || '/run/secrets';

    try {
        return fs.readFileSync(path.join(secretsPath, fileName)).toString().trim();
    } catch (e) {
        return null;
    }
}