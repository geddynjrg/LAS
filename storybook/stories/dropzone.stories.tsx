import type { Meta, StoryObj } from "@storybook/react";

import {
  Dropzone,
  DropzoneAccepted,
  DropzoneDragAccepted,
  DropzoneDragDefault,
  DropzoneDragRejected,
  DropzoneInput,
  DropzoneRejected,
  DropzoneUploadIcon,
  DropzoneZone,
} from "@workspace/ui/components/dropzone";

const meta = {
  component: Dropzone,
} satisfies Meta<typeof Dropzone>;

export default meta;

type Story = StoryObj<typeof meta>;

// 1 MB
const MAX_FILE_SIZE = 1e6;

export const Primary = {
  render: (_props) => {
    return (
      <div className="grid gap-4">
        <Dropzone
          accept={{
            "image/*": [".jpg", ".jpeg", ".png"],
            "application/pdf": [".pdf"],
          }}
          maxSize={MAX_FILE_SIZE}
        >
          <DropzoneZone className="flex items-center justify-center gap-2">
            <DropzoneInput />
            <DropzoneUploadIcon />

            <DropzoneDragAccepted>
              <p>Drop files here</p>
            </DropzoneDragAccepted>
            <DropzoneDragRejected>
              <p>This file is not supported</p>
            </DropzoneDragRejected>
            <DropzoneDragDefault>
              <p>Drop files here or click to upload</p>
            </DropzoneDragDefault>
          </DropzoneZone>

          <DropzoneAccepted>
            {(files) => (
              <ul>
                {files.map((file) => (
                  <li key={file.name}>{file.name}</li>
                ))}
              </ul>
            )}
          </DropzoneAccepted>

          <DropzoneRejected>
            {(files) => (
              <ul>
                {files.map((file) => (
                  <li key={file.file.name}>
                    {file.errors.map((f) => f.message).join(", ")}
                  </li>
                ))}
              </ul>
            )}
          </DropzoneRejected>
        </Dropzone>
      </div>
    );
  },
} satisfies Story;
