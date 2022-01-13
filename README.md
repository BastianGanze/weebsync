[![Build/release](https://github.com/BastianGanze/weebsync/actions/workflows/main.yml/badge.svg)](https://github.com/BastianGanze/weebsync/actions/workflows/main.yml)

# Example Config

`syncOnStart`, `autoSyncIntervalInMinutes`, `debugFileNames` are optional. Default values below.

```json
{
  "syncOnStart": true,
  "autoSyncIntervalInMinutes": 30,
  "debugFileNames": false,
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
