const fs = require('fs');
const path = require('path');

const loginImage = 'C:\\Users\\lmaob\\.gemini\\antigravity\\brain\\3a01126c-65c7-4e13-8337-79006ab7c1e4\\anime_boy_login_1784718851528.png';
const dashboardImage = 'C:\\Users\\lmaob\\.gemini\\antigravity\\brain\\3a01126c-65c7-4e13-8337-79006ab7c1e4\\anime_boy_bg_1784718815198.png';
const createKeyImage = 'C:\\Users\\lmaob\\.gemini\\antigravity\\brain\\3a01126c-65c7-4e13-8337-79006ab7c1e4\\anime_boy_create_1784718827706.png';
const editKeyImage = 'C:\\Users\\lmaob\\.gemini\\antigravity\\brain\\3a01126c-65c7-4e13-8337-79006ab7c1e4\\anime_boy_edit_1784718840409.png';

const publicDir = path.join(__dirname, 'public');

if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
}

fs.copyFileSync(loginImage, path.join(publicDir, 'anime-login.png'));
fs.copyFileSync(dashboardImage, path.join(publicDir, 'anime-bg.png'));
fs.copyFileSync(createKeyImage, path.join(publicDir, 'anime-create.png'));
fs.copyFileSync(editKeyImage, path.join(publicDir, 'anime-edit.png'));

console.log('Images successfully copied to the public folder!');
