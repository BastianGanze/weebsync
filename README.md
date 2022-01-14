[![Build/release](https://github.com/BastianGanze/weebsync/actions/workflows/main.yml/badge.svg)](https://github.com/BastianGanze/weebsync/actions/workflows/main.yml)

# Example Config

`syncOnStart`, `autoSyncIntervalInMinutes`, `debugFileNames` and `startAsTray` are optional. Default values below.

`autoSyncIntervalInMinutes` minimal value is 5 Minutes because of spam.

```json
{
  "syncOnStart": true,
  "autoSyncIntervalInMinutes": 30,
  "debugFileNames": false,
  "startAsTray": false,
    "server": {
        "host": "",
        "port": 21,
        "user": "",
        "password": ""
    },
    "syncMaps": [
        {
            "originFolder": "",
            "destinationFolder": "",
            "fileRegex": "",
            "fileRenameTemplate": ""
        }
    ]
}
```
