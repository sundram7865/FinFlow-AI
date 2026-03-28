export interface Report {
  id:        string
  userId:    string
  month:     number
  year:      number
  fileUrl:   string
  summary:   string | null
  createdAt: string
}