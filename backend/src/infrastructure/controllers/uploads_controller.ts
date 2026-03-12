export default class UploadsController {
  async store({ response }: { response: any }) {
    return response.ok({ status: 'uploaded', message: 'Upload endpoint scaffolded' })
  }
}
