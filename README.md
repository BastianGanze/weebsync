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

Example for `syncMap`:

```
    { 
        "originFolder": "/PATH_TO_REMOTE_FTP_FOLDER/",
        "destinationFolder": "F:/PATH_TO_LOCAL_FOLDER/",
        "fileRegex": ".*? E([0-9][0-9]|[0-9]|[0-9]\\.[1-9]|[0-9][0-9]\\.[0-9])v?(.)? (.*)?\\.extension",
        "fileRenameTemplate": "Something Something name - {{renumber $1 13}} {{$3}}.extension 
    },
```

For `fileRenameTemplate` you can use the regex groups by their number with double curly brackets e.g. `{{$1}}`.
There is a helper method to renumber `{{renumber $1 13}}` where `$1` is the first regex group of the `fileRegex` that matches and `13` is the number that will be subtracted from that regex group. Obviously `$1` should only match a number then.
