/* eslint-disable @typescript-eslint/explicit-function-return-type */
import React, { useEffect } from 'react'
import axios from 'axios'
import answers from '../../info/answers.json'

import string64obj from '../../info/string64obj.json'
import Loading from '../../components/Loading/Loading'
import AutofillQuestions from '../../components/AutofillQuestions/AutofillQuestions'
import ChatMessagesList from '../../components/ChatMessagesList/ChatMessagesList'
import ChatForm from './ChatForm'
import { ActionType, type State } from '../VideoAssistant/hooks/useChat'
import StartNewGroup from '../VideoAssistant/StartNewGroup'

export enum DefaultVideo {
  FILE_NAME = '#4 Cooper Kupp (WR, Rams) | Top 100 Players in 2022.mp4',
  FILE_PATH = 'https://firebasestorage.googleapis.com/v0/b/shark-4be33.appspot.com/o/%234%20Cooper%20Kupp%20(WR%2C%20Rams)%20%7C%20Top%20100%20Players%20in%202022.mp4?alt=media&token=53e18668-b339-4ba2-b7fc-f88fa2e033da'
}

export interface ChatSelectProps {
  chatState: State
  chatDispatch: React.Dispatch<any>
  showAutofillQuestions: boolean
  setCurrentVideoFile: (file: string) => void
  setShowAutofillQuestions: (show: boolean) => void
  setAutofillApi: (file: boolean) => void
  setChoosedElement: (file: number | undefined) => void
  submitButtonRef: React.MutableRefObject<HTMLButtonElement | null>
  chatContainerRef: React.RefObject<HTMLDivElement>
  videoRef: React.RefObject<HTMLVideoElement>
  storage: any
  videoFiles: string[]
  currentVideoFile: string
}

const ChatSelector: React.FC<ChatSelectProps> = ({ chatState, chatDispatch, chatContainerRef, setAutofillApi, submitButtonRef, setChoosedElement, setCurrentVideoFile, setShowAutofillQuestions, showAutofillQuestions, videoRef }) => {
  const { selectedFile, inputBox, responseText, arrayMessages, loading } = chatState
  const handleChatApi = async () => {
    if (selectedFile !== null && selectedFile !== undefined) {
      const answersAsrAndTwelve = string64obj[selectedFile as keyof typeof string64obj]
      chatDispatch({ type: ActionType.SET_LOADING, payload: true })

      chatDispatch({ type: ActionType.SET_RESPONSE_TEXT, payload: inputBox })
      chatDispatch({
        type: ActionType.SET_ARRAY_MESSAGES,
        payload: [
          {
            sender: 'user',
            text: inputBox,
            link: '',
            linkText: '',
            twelveText: '',
            asrTest: '',
            lameText: '',
            question: inputBox
          }
        ]
      })
      const requestData = {
        videos: answersAsrAndTwelve !== null ? [answersAsrAndTwelve?.vid] : [],
        prompt: inputBox,
        agent_history: null,
        duration: 60.0,
        asr: answersAsrAndTwelve !== null ? answersAsrAndTwelve?.asr : '',
        description: answersAsrAndTwelve !== null ? answersAsrAndTwelve?.description : ''
      }

      try {
        const response = await axios.post(
          'https://75b4-2600-8802-3911-f100-8409-7963-3410-6b4.ngrok-free.app/worker_generate_stream',
          requestData
        )

        const responseData2 = await axios.post(
          'https://75b4-2600-8802-3911-f100-8409-7963-3410-6b4.ngrok-free.app/worker_generate_stream2',
          requestData
        )

        let jsonObject2 = JSON.stringify(responseData2.data)
        jsonObject2 = JSON.parse(jsonObject2)

        const startIndex2 = jsonObject2.indexOf('text')
        const endIndex2 = jsonObject2.indexOf('error_code')
        const extractedText2 = jsonObject2.slice(startIndex2 + 8, endIndex2 - 4).trim()
        console.log(extractedText2)
        //
        let jsonObject = JSON.stringify(response.data)
        jsonObject = JSON.parse(jsonObject)
        chatDispatch({ type: ActionType.SET_LOADING, payload: false })

        const startIndex = jsonObject.indexOf('text')
        const endIndex = jsonObject.indexOf('error_code')
        const extractedText = jsonObject.slice(startIndex + 8, endIndex - 4).trim()
        chatDispatch({
          type: ActionType.SET_ARRAY_MESSAGES,
          payload: [
            {
              sender: 'ai',
              text: extractedText,
              link: '',
              linkText: '',
              twelveText: extractedText,
              asrTest: extractedText2,
              lameText: '',
              question: inputBox
            }
          ]
        })
      } catch (error) {
        console.error('Request error:', error)
        chatDispatch({ type: ActionType.SET_LOADING, payload: false })
      }
    }
    chatDispatch({ type: ActionType.SET_INPUT_BOX, payload: '' })
  }

  const answersFull = answers[selectedFile as unknown as keyof typeof answers]

  const autofillQuestions = answersFull?.map((item) => item.question)

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent): void => {
      if (event.key === 'Enter' && submitButtonRef.current !== null && submitButtonRef.current !== undefined) {
        // Check if the Enter key is pressed and the submit button exists
        submitButtonRef.current.click() // Trigger a click event on the submit button
      }
    }

    const inputElement = document.querySelector('input')
    if (inputElement !== null) {
      inputElement.addEventListener('keydown', handleKeyPress)
    }

    return () => {
      // Cleanup the event listener when the component unmounts
      if (inputElement !== null) {
        inputElement.removeEventListener('keydown', handleKeyPress)
      }
    }
  })

  useEffect(() => {
    chatDispatch({ type: ActionType.SET_SELECTED_FILE, payload: DefaultVideo.FILE_NAME })
    setCurrentVideoFile(DefaultVideo.FILE_PATH)
  }, [])

  useEffect(() => {
    if (autofillQuestions?.some((question) => question === responseText)) {
      setAutofillApi(true)
    } else {
      setAutofillApi(false)
    }
  }, [arrayMessages, autofillQuestions, responseText, setAutofillApi])

  const clearChat = (): void => {
    chatDispatch({ type: ActionType.SET_LOADING, payload: false })
    chatDispatch({ type: ActionType.SET_INPUT_BOX, payload: '' })
    chatDispatch({
      type: ActionType.SET_ARRAY_MESSAGES_CLEAN,
      payload: []
    })
  }

  return (
    <div>
          <div className={'pl-[70px] pr-[70px] pt-6 flex-col border-l border-gray-300 flex w-[55vw] h-[80vh] overflow-y-auto'} ref={chatContainerRef} >
            <ChatMessagesList
                chatState={chatState}
                chatDispatch={chatDispatch}
                videoRef={videoRef}
                setChoosedElement={setChoosedElement}
            />
            <div className={`justify-end flex items-end flex-col flex-1 ${showAutofillQuestions ? 'gap-3' : 'gap-6'}`}>
              {loading ? <Loading/> : '' }
            </div>
            {showAutofillQuestions &&
              <div className='relative'>
                <div className="sticky">
                    <AutofillQuestions
                        chatDispatch={chatDispatch}
                        autofillQuestions={autofillQuestions}
                        setShowAutofillQuestions={setShowAutofillQuestions}
                    />
                </div>
              </div>
              }
            {!loading ? <StartNewGroup clearChat={clearChat}/> : ''}
          </div>
          <ChatForm
            chatState={chatState}
            chatDispatch={chatDispatch}
            setShowAutofillQuestions={setShowAutofillQuestions}
            submitButtonRef={submitButtonRef}
            autofillQuestions={autofillQuestions}
            setAutofillApi={setAutofillApi}
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            handleChatApi={handleChatApi}
            showAutofillQuestions={showAutofillQuestions}
          />
          <div className={'pl-6 pr-6 flex-col border-solid border-l border-[#E5E6E4] flex w-[50vw] h-[50vh]'}>
          </div>
        </div>
  )
}

export default ChatSelector