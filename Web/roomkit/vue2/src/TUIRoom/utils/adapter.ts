import { isWeChat } from './environment';
declare let uni: any;
export const clipBoard = (
  data: any
): Promise<{
  code: number;
  data?: any;
  err?: any;
}> =>
  new Promise(async (resolve, reject) => {
    if (!isWeChat) {
      const textString = data.toString();
      try {
        await navigator.clipboard.writeText(`${data}`);
        resolve({ code: 0, data });
      } catch (err) {
        try {
          copyTextByDocumentExecCommand(textString);
          resolve({ code: 0, data });
        } catch (err) {
          reject({ code: -1, err });
        }
      }
      return;
    }
    uni.setClipboardData({
      data,
      success() {
        uni.getClipboardData({
          success(data: any) {
            resolve({ code: 0, data });
          },
          fail(err: any) {
            reject({ code: -1, err });
          },
        });
      },
      fail(err: any) {
        reject({ code: -1, err });
      },
    });
  });

function copyTextByDocumentExecCommand(textString: string) {
  try {
    const input = document.createElement('input');
    input.id = 'copy-input';
    input.readOnly = true;
    input.style.position = 'absolute';
    input.style.left = '-1000px';
    input.style.zIndex = '-1000';
    document.body.appendChild(input);
    input.value = textString;
    selectText(input, 0, textString.length);
    if (document.execCommand('copy')) {
      document.execCommand('copy');
    }
    input.blur();
  } catch (err) {}
}

function selectText(
  textbox: HTMLInputElement,
  startIndex: number,
  stopIndex: number
) {
  if ((textbox as any).createTextRange) {
    const range = (textbox as any).createTextRange();
    range.collapse(true);
    range.moveStart('character', startIndex);
    range.moveEnd('character', stopIndex - startIndex);
    range.select();
  } else {
    (textbox as any).setSelectionRange(startIndex, stopIndex);
    (textbox as any).focus();
  }
}
