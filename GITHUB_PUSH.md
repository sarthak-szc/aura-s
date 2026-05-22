# GitHub push fix (sarthak-szc/aura-s)

## Error 1: `gh is not recognized`
GitHub CLI installed नाही. **ऐची गरज नाही** — खाली Option A वापरा.

## Error 2: `Permission denied to sarthak-mallav`
तुमचा PC **sarthak-mallav** ने login आहे, repo **sarthak-szc** चा आहे.

---

## Option A — Personal Access Token (सोपं)

1. **sarthak-szc** account ने login: https://github.com/settings/tokens
2. **Generate new token (classic)** → scope: `repo` ✓
3. Token copy करा

4. Terminal:
```cmd
cd "c:\Users\Sarthak\Desktop\SZC Project\Aura Planning Project"
git push https://sarthak-szc:YOUR_TOKEN_HERE@github.com/sarthak-szc/aura-s.git main
```
(`YOUR_TOKEN_HERE` ऐवजी token paste)

5. नंतर साठी:
```cmd
git remote set-url origin https://github.com/sarthak-szc/aura-s.git
git push -u origin main
```
(Windows login window येईल — sarthak-szc + token)

---

## Option B — जुने credentials काढा

1. Windows Search → **Credential Manager**
2. **Windows Credentials** → `git:https://github.com` delete
3. Terminal:
```cmd
git push -u origin main
```
4. Browser/login → **sarthak-szc** निवडा

---

## Option C — GitHub CLI install

```cmd
winget install GitHub.cli
```
Terminal **बंद करून पुन्हा उघडा**, मग:
```cmd
gh auth login
git push -u origin main
```

---

## Typo लक्षात
```cmd
aura-s\Scripts\activate
```
(`aua-s` ❌)
