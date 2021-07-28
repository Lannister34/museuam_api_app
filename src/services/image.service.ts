import API from "../api/api";
import ColorThief from "color-thief";
import * as fs from "fs";

enum PrimaryColor {
  None = "None",
  Red = "Red",
  Green = "Green",
  Blue = "Blue",
}

interface IImageData {
  id: string;
  url: string;
  dominantColour: string;
  dominantPrimaryColour: PrimaryColor;
}

export class ImageService {
  constructor() {
    this.colorThief = new ColorThief();
  }

  private colorThief;

  private arrayToRgba = (arr: Array<number>): string => {
    return `rgb(${arr[0]}, ${arr[1]}, ${arr[2]})`;
  };

  private findMaxNumIndex = (array: Array<number>): number =>
    array.reduce((maxIndex, item, index, array) => {
      return item > array[maxIndex] ? index : maxIndex;
    }, 0);

  private isMonochromeColor = (colorArray: Array<number>): boolean => {
    return colorArray[0] === colorArray[1] && colorArray[1] === colorArray[2];
  };

  private findPrimaryColor = (colors: Array<Array<number>>): PrimaryColor => {
    let isMonochromeImage = true;

    const colorCount = colors.reduce(
      (count, color) => {
        if (isMonochromeImage) {
          isMonochromeImage = this.isMonochromeColor(color);
        }
        const maxIndex = this.findMaxNumIndex(color);
        count[maxIndex]++;
        return count;
      },
      [0, 0, 0]
    );

    if (isMonochromeImage) {
      return PrimaryColor.None;
    }

    const primaryColorIndex = this.findMaxNumIndex(colorCount);

    switch (primaryColorIndex) {
      case 0:
        return PrimaryColor.Red;
      case 1:
        return PrimaryColor.Green;
      case 2:
        return PrimaryColor.Blue;
      default:
        return PrimaryColor.None;
    }
  };

  private processImage = async (imageId: number): Promise<IImageData> => {
    const image = await API.getImageData(imageId);
    const imageBuffer = Buffer.from(
      await API.getImageBuffer(image.primaryImageSmall as string)
    );

    const dominantColor = this.colorThief.getColor(imageBuffer);
    const palette = this.colorThief.getPalette(imageBuffer, 5);

    return {
      id: image.objectID as string,
      url: image.primaryImageSmall as string,
      dominantColour: this.arrayToRgba(dominantColor),
      dominantPrimaryColour: this.findPrimaryColor(palette),
    };
  };

  getImagesByDepartment = async (departmentId: number, limit?: number) => {
    let imageIds;
    try {
      imageIds = (
        await API.getObjects({
          departmentIds: departmentId,
        })
      ).objectIDs;
    } catch (e) {
      throw Error("Can't get department info.");
    }

    if (imageIds.length === 0) {
      throw Error("There are no images.");
    }

    if (limit && imageIds.length > limit) {
      imageIds.length = limit;
    }

    const result = [];

    for (let i = 0; i < imageIds.length; i++) {
      try {
        console.log(`Processing ${i + 1} image...`);
        const imageData = await this.processImage(imageIds[i]);
        result.push(imageData);
      } catch (e) {
        console.error(`Can't get ${i + 1} image.`);
      }
    }

    fs.mkdir("results", 0o777, function (err) {
      if (err && err.code !== "EEXIST") {
        throw err;
      }

      fs.writeFileSync(`results/images.json`, JSON.stringify(result));

      console.log(
        'Success! Check out "images.json" file in "results" directory.'
      );
    });
  };
}

export const imageService = new ImageService();
