import { useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { usePrivyWagmi } from "@privy-io/wagmi-connector";
import { useNetwork, useSwitchNetwork, useTransaction } from "wagmi";
import { keccak256, encodeAbiParameters, parseAbiParameters, parseUnits, formatUnits } from "viem";
import { useContractRead, usePrepareContractWrite, useContractWrite, useWaitForTransaction } from "wagmi";
import eTransferAbi from "../abi/etransfer.js";
import tokenAbi from "../abi/token.js";
import { nanoid } from "nanoid";
import db from "../firebase.ts";
import { ref, update, set, onValue, get } from "firebase/database";
import { hashEmail } from "../helperFunctions.ts";
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
  Divider,
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
  Box,
  Flex,
  Text,
  Spacer,
} from "@chakra-ui/react";
import { getRedirectResult } from "firebase/auth";

const ETRANSFER_ADDRESS = "0xB2D2f29e572577854306099DFA24B07596eC92a7";
const TOKEN_ADDRESS = "0x62e6940856c42bD23C0c895824921678A37A62aE";

type TransferWithId = {
  from: `0x${string}`;
  to: `0x${string}`;
  refundAddress: `0x${string}`;
  amount: bigint;
  id: string;
  index: bigint;
};

type Contact = {
  email: string;
  name: string;
};

function SendMoney() {
  const toast = useToast();
  const { user } = usePrivy();
  const { wallet: activeWallet, setActiveWallet } = usePrivyWagmi();

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
  const { data: balance, isLoading: isBalanceLoading } = useContractRead({
    address: TOKEN_ADDRESS,
    abi: tokenAbi,
    functionName: "balanceOf",
    args: [activeWallet?.address as `0x${string}`],
    watch: true,
  });

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

  async function handleSendTransfer() {
    const checkUserPath = ref(db, "users/" + hashEmail(destinationEmail));
    const snapshot = await get(checkUserPath);

    if (!snapshot.exists()) {
      // If user isn't linked, j temporarily add them
      const newUserPath = ref(db, "users/");
      const updates: { [key: string]: { email: string; address: string; name: string } } = {};
      updates[hashEmail(destinationEmail)] = { email: destinationEmail, address: "", name: "" };
      update(newUserPath, updates);
    }
    sendTransfer?.();
  }

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
    args: [user?.wallet?.address as `0x${string}`],
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

  const [depositModalChoice, setDepositModalChoice] = useState<string>();

  const allUserAccounts: string[] = [];

  user?.linkedAccounts.forEach((account) => {
    if (account.type === "wallet") {
      allUserAccounts.push(account.address);
    }
  });
  const [name, setName] = useState<string>("");
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    return onValue(ref(db, "users/" + hashEmail(user?.email?.address!)), (snapshot) => {
      const data = snapshot.val();
      const name: string = data.name;
      const contacts: Contact[] = data.contacts;
      setName(name);
      setContacts(contacts && contacts.length > 0 ? contacts : []);
    });
  }, []);

  const { wallets } = useWallets();

  return (
    <Flex direction={"column"}>
      <Flex direction={"column"} px={"16px"} py={"8px"}>
        <Text fontWeight={"regular"} fontSize={"sm"}>
          Logged into e-Transfer®
        </Text>
      </Flex>
      <Flex direction={"column"} padding={"16px"} backgroundColor={"gray.50"}>
        <Text fontWeight={"medium"} fontSize={"lg"}>
          {name.toUpperCase()}
        </Text>

        <Text fontWeight={"normal"} fontSize={"md"}>
          {user?.email?.address!}
        </Text>
      </Flex>

      <Flex direction={"column"} padding={"16px"} gap="8px">
        <Flex direction={"row"} justifyContent={"space-between"}>
          <Text fontWeight={"regular"} fontSize={"sm"}>
            From Account
          </Text>
          <Button variant={"link"} fontWeight={"regular"} fontSize={"sm"}>
            + Link Account
          </Button>
        </Flex>

        <Flex direction={"row"} gap={"20px"} alignItems={"center"}>
          <Select>
            {wallets.map((wallet) => {
              return (
                <option key={wallet.address} value={wallet.address}>
                  {wallet.address}
                </option>
              );
            })}
          </Select>

          <Text fontWeight={"regular"} fontSize={"md"}>
            ${balance ? formatUnits(balance, 18) : "0.00"}
          </Text>
        </Flex>

        <Divider h="1px" backgroundColor={"gray.200"} orientation="horizontal" my="8px" />

        <Flex direction={"row"} justifyContent={"space-between"}>
          <Text fontWeight={"regular"} fontSize={"sm"}>
            To
          </Text>
          <Button variant={"link"} fontWeight={"regular"} fontSize={"sm"}>
            + Add Contact
          </Button>
        </Flex>

        <Select>
          {contacts.map((contact) => {
            return (
              <option key={contact.email} value={contact.email}>
                {contact.name} \({contact.email}\)
              </option>
            );
          })}
        </Select>

        <Divider h="1px" backgroundColor={"gray.200"} orientation="horizontal" my="8px" />

        <Flex direction={"row"} justifyContent={"space-between"}>
          <Flex direction={"column"}>
            <Text fontWeight={"regular"} fontSize={"sm"}>
              Amount
            </Text>
            <Button variant={"link"} fontWeight={"regular"} fontSize={"xs"}>
              + Mint USDC
            </Button>
          </Flex>

          <Flex direction={"row"} alignItems={"center"}>
            <Text fontWeight={"regular"} fontSize={"xl"} mr={"5px"}>
              $
            </Text>
            <NumberInput size={"sm"} width={"150px"}>
              <NumberInputField />
            </NumberInput>
          </Flex>
        </Flex>

        <Divider h="1px" backgroundColor={"gray.200"} orientation="horizontal" my="8px" />

        <Button isLoading={isApproveLoading || isApproveWaitingForConf}  height={"50px"} onClick={approve}>
          Approve USDC
        </Button>
        <Button isLoading={isSendTransferWaitingForConf || isSendTransferLoading} backgroundColor={"brand"} height={"50px"} onClick={handleSendTransfer}>
          Send money
        </Button>
      </Flex>
    </Flex>
  );
}

export default SendMoney;
