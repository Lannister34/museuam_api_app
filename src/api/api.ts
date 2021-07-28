import axios, { AxiosInstance } from "axios";

interface IResponseData {
  total: number;
  objectIDs: Array<number>;
}

class Api {
  private readonly app: AxiosInstance;
  public url: string =
    "https://collectionapi.metmuseum.org/public/collection/v1";

  constructor() {
    this.app = axios.create();
  }

  getObjects = async (
    params?: Record<string, unknown>
  ): Promise<IResponseData> => {
    const response = await this.app.get(`${this.url}/objects`, {
      params,
    });

    return response.data;
  };

  getImageData = async (imageId: number): Promise<Record<string, unknown>> => {
    const response = await this.app.get(`${this.url}/objects/${imageId}`);
    return response.data;
  };

  getImageBuffer = async (url: string): Promise<ArrayBuffer> => {
    const response = await this.app.get(url, {
      responseType: "arraybuffer",
    });
    return response.data;
  };
}

const API = new Api();

export default API;
