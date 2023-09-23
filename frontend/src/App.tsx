import { useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { usePrivyWagmi } from "@privy-io/wagmi-connector";
import { useNetwork, useSwitchNetwork, useTransaction } from "wagmi";
import { keccak256, encodeAbiParameters, parseAbiParameters, parseUnits, formatUnits } from "viem";
import { useContractRead, usePrepareContractWrite, useContractWrite, useWaitForTransaction } from "wagmi";
import eTransferAbi from "./abi/etransfer.ts";
import tokenAbi from "./abi/token.ts";
import { nanoid } from "nanoid";
import db from "./firebase.ts";
import { ref, update, set, onValue } from "firebase/database";

import {
  Button,
  Input,
  Heading,
  InputGroup,
  useToast,
  InputLeftElement,
  InputRightElement,
  Container,
  Center,
  UnorderedList,
  Spinner,
  ListItem,
  NumberInput,
  NumberInputField,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  HStack,
  VStack,
  Grid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Select,
} from "@chakra-ui/react";

const ETRANSFER_ADDRESS = "0x047CbFe0a82cad48b0c672eF73475955d6c7a2f2";
const TOKEN_ADDRESS = "0x04433318c6c76939dc1451600530195281Fa8858";
function hashEmail(email: string): `0x${string}` {
  return keccak256(encodeAbiParameters(parseAbiParameters("string"), [email]));
}

type TransferWithId = {
  from: `0x${string}`;
  to: `0x${string}`;
  refundAddress: `0x${string}`;
  amount: bigint;
  id: string;
  index: bigint;
};

function App() {
  const toast = useToast();

  const { isOpen: isDepositModalOpen, onOpen: openDepositModal, onClose: closeDepositModal } = useDisclosure();
  const { login, authenticated, user, ready, logout, createWallet } = usePrivy();
  const { wallets } = useWallets();
  const { wallet: activeWallet, setActiveWallet } = usePrivyWagmi();
  const { chain } = useNetwork();
  const { chains, pendingChainId, isLoading, switchNetwork } = useSwitchNetwork({ throwForSwitchChainNotSupported: true });
  const { data: allowance, isLoading: isAllowanceLoading } = useContractRead({
    address: TOKEN_ADDRESS,
    abi: tokenAbi,
    functionName: "allowance",
    args: [activeWallet?.address as `0x${string}`, ETRANSFER_ADDRESS],
    enabled: typeof activeWallet !== "undefined",
  });
  const { data: linkedEmail, isLoading: isLinkedEmailLoading } = useContractRead({
    address: ETRANSFER_ADDRESS,
    abi: eTransferAbi,
    functionName: "linkedEmail",
    args: [activeWallet?.address as `0x${string}`],
    enabled: typeof activeWallet !== "undefined",
  });
  const { data: pendingTransfers, isLoading: arePendingTransfersLoading } = useContractRead({
    address: ETRANSFER_ADDRESS,
    abi: eTransferAbi,
    functionName: "getPendingTransfers",
    watch: true,
  });
  const { data: balance, isLoading: isBalanceLoading } = useContractRead({
    address: TOKEN_ADDRESS,
    abi: tokenAbi,
    functionName: "balanceOf",
    args: [activeWallet?.address as `0x${string}`],
    watch: true,
  });

  const receivedTransfers: TransferWithId[] = [];
  const myPendingTransfers: TransferWithId[] = [];
  if (pendingTransfers) {
    pendingTransfers.forEach((transfer, index) => {
      if (transfer.from === linkedEmail) {
        myPendingTransfers.push({ id: nanoid(), index: BigInt(index), ...transfer });
      }
      if (transfer.to === linkedEmail) {
        receivedTransfers.push({ id: nanoid(), index: BigInt(index), ...transfer });
      }
    });
  }

  const [destinationEmail, setDestinationEmail] = useState<string>("");
  const [sendAmount, setSendAmount] = useState<string>("");
  const [mintAmount, setMintAmount] = useState<string>("");

  const { config: sendTransferConfig } = usePrepareContractWrite({
    address: ETRANSFER_ADDRESS,
    abi: eTransferAbi,
    functionName: "sendTransfer",
    args: [hashEmail(destinationEmail.toLowerCase()), parseUnits(sendAmount, 18)],
  });
  const { write: sendTransfer, data: sendTransferData, isLoading: isSendTransferLoading } = useContractWrite(sendTransferConfig);
  const { isLoading: isSendTransferWaitingForConf } = useWaitForTransaction({
    hash: sendTransferData?.hash,
    onSuccess(data) {
      toast({
        title: "Transaction success.",
        status: "success",
        isClosable: true,
        duration: 6000,
      });
    },
    onError(error) {
      toast({
        title: "Transaction error.",
        description: error.message,
        status: "error",
        isClosable: true,
        duration: 6000,
      });
    },
  });

  const { config: approveConfig } = usePrepareContractWrite({
    address: TOKEN_ADDRESS,
    abi: tokenAbi,
    functionName: "approve",
    args: [ETRANSFER_ADDRESS, BigInt(2) ** BigInt(256) - BigInt(1)],
  });
  const { write: approve, data: approveData, isLoading: isApproveLoading } = useContractWrite(approveConfig);
  const { isLoading: isApproveWaitingForConf } = useWaitForTransaction({
    hash: approveData?.hash,
    onSuccess(data) {
      toast({
        title: "Transaction success.",
        status: "success",
        isClosable: true,
        duration: 6000,
      });
    },
    onError(error) {
      toast({
        title: "Transaction error.",
        description: error.message,
        status: "error",
        isClosable: true,
        duration: 6000,
      });
    },
  });

  const { config: enableAutodepositConfig } = usePrepareContractWrite({
    address: ETRANSFER_ADDRESS,
    abi: eTransferAbi,
    functionName: "setAutodepositAddress",
    args: [user && user.wallet ? (user.wallet.address as `0x${string}`) : "0x"],
  });
  const { write: enableAutodeposit, data: enableAutodepositData, isLoading: isEnableAutodepositLoading } = useContractWrite(enableAutodepositConfig);
  const { isLoading: isEnableAutodepositWaitingForConf } = useWaitForTransaction({
    hash: enableAutodepositData?.hash,
    onSuccess(data) {
      toast({
        title: "Transaction success.",
        status: "success",
        isClosable: true,
        duration: 6000,
      });
    },
    onError(error) {
      toast({
        title: "Transaction error.",
        description: error.message,
        status: "error",
        isClosable: true,
        duration: 6000,
      });
    },
  });

  const { config: mintConfig } = usePrepareContractWrite({
    address: TOKEN_ADDRESS,
    abi: tokenAbi,
    functionName: "mint",
    args: [activeWallet?.address as `0x${string}`, parseUnits(mintAmount, 18)],
  });
  const { write: mint, data: mintData, isLoading: isMintLoading } = useContractWrite(mintConfig);
  const { isLoading: isMintWaitingForConf } = useWaitForTransaction({
    hash: mintData?.hash,
    onSuccess(data) {
      toast({
        title: "Transaction success.",
        status: "success",
        isClosable: true,
        duration: 6000,
      });
    },
    onError(error) {
      toast({
        title: "Transaction error.",
        description: error.message,
        status: "error",
        isClosable: true,
        duration: 6000,
      });
    },
  });

  const {
    write: receiveTransfer,
    data: receiveTransferData,
    isLoading: isReceiveTransferLoading,
  } = useContractWrite({ address: ETRANSFER_ADDRESS, abi: eTransferAbi, functionName: "receiveTransfer" });
  const { isLoading: isReceiveTransferWaitingForConf } = useWaitForTransaction({
    hash: receiveTransferData?.hash,
    onSuccess(data) {
      toast({
        title: "Transaction success.",
        status: "success",
        isClosable: true,
        duration: 6000,
      });
    },
    onError(error) {
      toast({
        title: "Transaction error.",
        description: error.message,
        status: "error",
        isClosable: true,
        duration: 6000,
      });
    },
  });

  const {
    write: cancelTransfer,
    data: cancelTransferData,
    isLoading: isCancelTransferLoading,
  } = useContractWrite({ address: ETRANSFER_ADDRESS, abi: eTransferAbi, functionName: "cancelTransfer" });
  const { isLoading: isCancelTransferWaitingForConf } = useWaitForTransaction({
    hash: cancelTransferData?.hash,
    onSuccess(data) {
      toast({
        title: "Transaction success.",
        status: "success",
        isClosable: true,
        duration: 6000,
      });
    },
    onError(error) {
      toast({
        title: "Transaction error.",
        description: error.message,
        status: "error",
        isClosable: true,
        duration: 6000,
      });
    },
  });

  useEffect(() => {
    async function runEffect() {
      if (ready && !authenticated) {
        login();
      } else if (ready && authenticated && user?.wallet) {
        // make sure wallet is on correct network
        const targetChainId = 420;
        const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === "privy")!;
        const currentChainId: number = parseInt(embeddedWallet.chainId);

        if (currentChainId !== targetChainId) {
          await embeddedWallet.switchChain(targetChainId);
        }
      } else {
        // In case embedded wallet creation bugged out when user first signed up.
        createWallet();
      }
    }
    runEffect();
  }, [authenticated, ready, user]);

  // Submit users info to firebase server
  useEffect(() => {
    if (ready && authenticated && user?.wallet) {
      const path = ref(db, "users/");
      const updates: { [key: string]: { email: string; address: string; name: string } } = {};
      const email = user?.email?.address!;
      const walletAddress = user?.wallet?.address!;

      updates[hashEmail(email)] = { email: email, address: walletAddress, name: "John Doe" };
      update(path, updates);
    }
  }, [ready, authenticated, user]);

  const [depositModalChoice, setDepositModalChoice] = useState<string>();

  const allUserAccounts: string[] = [];

  if (user) {
    user.linkedAccounts.forEach((account) => {
      if (account.type === "wallet") {
        allUserAccounts.push(account.address);
      }
    });

    return (
      <>
        <Center>
          <Container w={["100%", "75%"]} maxW={"800px"}>
            <Button onClick={login}>Login</Button>
            <Button onClick={logout}>Logout</Button>

            <h2>
              Logged in as {user && user.email ? user.email.address.toLowerCase() : "???"} ({activeWallet?.address})
            </h2>

            {chain && <div>Connected to {chain.name}</div>}

            {chains.map((x) => (
              <Button disabled={!switchNetwork || x.id === chain?.id} key={x.id} onClick={() => switchNetwork?.(x.id)}>
                {x.name}
                {isLoading && pendingChainId === x.id && " (switching)"}
              </Button>
            ))}

            <Heading>Autodeposit</Heading>

            <Button isLoading={isEnableAutodepositLoading || isEnableAutodepositWaitingForConf} colorScheme="teal" onClick={enableAutodeposit}>
              Enable Autodeposit
            </Button>

            <Heading>Mint USDC</Heading>
            <NumberInput value={mintAmount} onChange={(valueString) => setMintAmount(valueString)}>
              Balance: {balance ? formatUnits(balance, 18) : "???"} USDC
              <NumberInputField placeholder="Mint Amount (USDC)" />
              <Button colorScheme="teal" onClick={mint} isLoading={isMintLoading || isMintWaitingForConf}>
                Mint
              </Button>
            </NumberInput>

            <Heading>Send</Heading>
            <Input value={destinationEmail} onChange={(event) => setDestinationEmail(event.target.value)} placeholder="Destination Email"></Input>
            <NumberInput value={sendAmount} onChange={(valueString) => setSendAmount(valueString)}>
              <NumberInputField placeholder="Send Amount (USDC)" />
            </NumberInput>
            <Button onClick={approve} isLoading={isApproveLoading || isApproveWaitingForConf}>
              Approve
            </Button>
            <Button onClick={sendTransfer} isLoading={isSendTransferLoading || isSendTransferWaitingForConf} colorScheme="teal">
              Send
            </Button>

            <Heading>Receive</Heading>
            <HStack spacing={"24px"}>
              {receivedTransfers.map((transfer) => (
                <Card key={transfer.id}>
                  <CardHeader>From: {transfer.from}</CardHeader>
                  <CardBody>{formatUnits(transfer.amount, 18)} USDC</CardBody>
                  <CardFooter>
                    <Button colorScheme="teal" onClick={() => openDepositModal()}>
                      Accept
                    </Button>
                    <Button
                      colorScheme="red"
                      disabled={!cancelTransfer}
                      isLoading={isCancelTransferLoading || isCancelTransferWaitingForConf}
                      onClick={() => cancelTransfer({ args: [transfer.index] })}
                    >
                      Decline
                    </Button>

                    <Modal isOpen={isDepositModalOpen} onClose={closeDepositModal}>
                      <ModalOverlay />
                      <ModalContent>
                        <ModalHeader>Deposit e-Transfer</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                          <Select value={depositModalChoice} onChange={(event) => setDepositModalChoice(event.target.value)} placeholder="Deposit Account">
                            {allUserAccounts.map((account) => (
                              <option key={account} value={account}>
                                {account}
                              </option>
                            ))}
                          </Select>
                        </ModalBody>

                        <ModalFooter>
                          <Button
                            disabled={!receiveTransfer}
                            colorScheme="teal"
                            isLoading={isReceiveTransferLoading || isReceiveTransferWaitingForConf}
                            onClick={() => receiveTransfer({ args: [transfer.index, depositModalChoice as `0x${string}`] })}
                          >
                            Deposit
                          </Button>
                        </ModalFooter>
                      </ModalContent>
                    </Modal>
                  </CardFooter>
                </Card>
              ))}
            </HStack>

            <Heading>Pending Transfers</Heading>
            <HStack spacing={"24px"}>
              {myPendingTransfers.map((transfer) => (
                <Card key={transfer.id}>
                  <CardHeader>To: {transfer.to}</CardHeader>
                  <CardBody>{formatUnits(transfer.amount, 18)} USDC</CardBody>
                  <CardFooter>
                    <Button
                      colorScheme="red"
                      disabled={!cancelTransfer}
                      isLoading={isCancelTransferLoading || isCancelTransferWaitingForConf}
                      onClick={() => cancelTransfer({ args: [transfer.index] })}
                    >
                      Cancel
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </HStack>
          </Container>
        </Center>
      </>
    );
  }
}

export default App;
