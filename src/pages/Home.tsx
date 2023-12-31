import { useEffect, useState } from 'react'
import { Heading, Container, Text, Stack, Button, Input, InputGroup, InputLeftAddon, HStack, Avatar } from '@chakra-ui/react'
import { Auth } from '@polybase/auth'
import { ethPersonalSignRecoverPublicKey } from '@polybase/eth'
import { Polybase } from '@polybase/client'
import { useCollection } from '@polybase/react'

const db = new Polybase({
  defaultNamespace: 'pk/0xf7b70bfb4d45415754505084d90ae97027d4a4695025fc16effbb000144b359a451bd23998aee3604641fd3d70678d220ac5a1618d99705c2cc239253e49e05e/FazzyDrop',
})

const auth = new Auth()

async function getPublicKey() {
  const msg = 'Login with Chat'
  const sig = await auth.ethPersonalSign(msg)
  const publicKey = ethPersonalSignRecoverPublicKey(sig, msg)
  return '0x' + publicKey.slice(4)
}

export function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [nftId, setNftId] = useState('')


  const query = db.collection('NFT')
  const { data, error, loading } = useCollection(query)

  const nfts: any = data?.data

  const signIn = async () => {
    const res = await auth.signIn()

    // get public
    let publicKey = res.publicKey

    if (!publicKey) {
      publicKey = await getPublicKey()
    }

    db.signer(async (data: string) => {
      return {
        h: 'eth-personal-sign',
        sig: await auth.ethPersonalSign(data),
      }
    })

    // Create user if not exists
    try {
      const user = await db.collection('User').record(publicKey).get()
      console.log('User', user)
    } catch (e) {
      await db.collection('User').create([])
    }

    setIsLoggedIn(!!res)
  }

  useEffect(() => {
    auth.onAuthUpdate((authState) => {
      setIsLoggedIn(!!authState)

      db.signer(async (data: string) => {
        return {
          h: 'eth-personal-sign',
          sig: await auth.ethPersonalSign(data),
        }
      })
    })
  })

  const createNFT = async () => {
    const publicKey = await getPublicKey()
    await db.collection('NFT').create([nftId, db.collection('User').record(publicKey)])
  }
  //eslint-disable-next-line
  return (
    <Container p={10}>
      <Stack spacing={8} maxW='30em'>
        <Stack>
          <Heading as='h1'>Chats</Heading>
          <Text>Welcome to the amazing app that chats.</Text>
        </Stack>
        <Stack>
          {isLoggedIn ? (
            <Stack >
              < Heading as='h2' fontSize='2xl'>NFTS</Heading>
              {nfts?.map(() => {
                return (
                  <Stack maxW='30em'>
                    <HStack border='1px solid' borderColor='gray.100' borderRadius='md' p={4}>
                      <Avatar size='sm' name='Dan Abrahmov' src='https://bit.ly/dan-abramov' />
                      <Heading fontSize='lg'>@id</Heading>
                    </HStack>
                  </Stack>
                )
              })}
              <Stack>
                <Heading as='h2' fontSize='md'>Mint NFT</Heading>
                <InputGroup>
                  <InputLeftAddon children='@' />
                  <Input onChange={(e) => setNftId(e.target.value)} />
                </InputGroup>
                <Button onClick={createNFT}>Create</Button>
              </Stack>
            </Stack>
          ) : (
            <Button onClick={signIn}>Login with Wallet</Button>
          )}
        </Stack>
        {isLoggedIn && (
          <Stack>
            <Heading as='h2' fontSize='2xl'>Logout</Heading>
            <Button>Logout</Button>
          </Stack>
        )}
      </Stack >
    </Container>
  )
}
