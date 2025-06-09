'use strict';

const form = document.getElementById('createForm');
const input = document.getElementById('repo');
const filePath = '.github/workflows/matlab.yml';

function parseRepo(input) {
    try {
        const url = new URL(input);
        const parts = url.pathname.split('/').filter(Boolean);
        return parts.length >= 2 ? { owner: parts[0], repo: parts[1] } : null;
    } catch {
        const parts = input.split('/').filter(Boolean);
        return parts.length === 2 ? { owner: parts[0], repo: parts[1] } : null;
    }
}

form.addEventListener('submit', function (event) {
    event.preventDefault();

    const repoInfo = parseRepo(input.value.trim());
    if (!repoInfo) {
        input.classList.add('is-invalid');
        return;
    }
    input.classList.remove('is-invalid');

    fetch('templates/basic.yml')
        .then(response => response.text())
        .then(yaml => {
            const encodedYaml = encodeURIComponent(yaml);
            const url = `https://github.com/${repoInfo.owner}/${repoInfo.repo}/new/main?filename=${filePath}&value=${encodedYaml}`;
            window.location.href = url;
        });
});


