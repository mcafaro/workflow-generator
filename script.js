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

    const useBatchToken = document.getElementById('useBatchToken').checked;
    const useVirtualDisplay = document.getElementById('useVirtualDisplay').checked;
    const buildAcrossPlatforms = document.getElementById('buildAcrossPlatforms').checked;

    const yamlObj = {
        name: 'MATLAB',
        on: {
            push: { branches: ['main'] },
            pull_request: { branches: ['main'] },
            workflow_dispatch: {}
        },
        ...(useBatchToken
            ? {
                env: { MLM_LICENSE_TOKEN: '${{ secrets.MyToken }}' }
            } : {}),
        jobs: {
            build: {
                ...(buildAcrossPlatforms
                    ? {
                        strategy: {
                            matrix: {
                                os: ['ubuntu-latest', 'windows-latest', 'macos-latest']
                            }
                        },
                        'runs-on': '${{ matrix.os }}'
                    }
                    : {
                        'runs-on': 'ubuntu-latest'
                    }),
                steps: [
                    {
                        uses: 'actions/checkout@v4'
                    },
                    ...(useVirtualDisplay
                        ? [
                            {
                                name: 'Start virtual display server',
                                if: "runner.os == 'Linux'",
                                run: [
                                    'sudo apt-get install -y xvfb',
                                    'Xvfb :99 &',
                                    'echo "DISPLAY=:99" >> $GITHUB_ENV'
                                ].join('\n')
                            }
                        ]
                        : []),
                    {
                        name: 'Set up MATLAB',
                        uses: 'matlab-actions/setup-matlab@v2'
                    },
                    {
                        name: 'Run MATLAB command',
                        uses: 'matlab-actions/run-command@v2',
                        with: {
                            command: "disp('Hello, World!')"
                        }
                    }
                ]
            }
        }
    };

    const finalYaml = jsyaml.dump(yamlObj, { lineWidth: -1, noArrayIndent: true });
    const encoded = encodeURIComponent(finalYaml);
    const url = `https://github.com/${repoInfo.owner}/${repoInfo.repo}/new/main?filename=${filePath}&value=${encoded}`;
    window.location.href = url;
});



